use tokio::{time::{sleep, Duration}};
use tracing::{error, warn};
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, AUTHORIZATION};
use serde::{Deserialize, Serialize};
use serde_json::{from_str};
use chrono::Utc;
use std::fs;

use crate::commands::favorite::{
    create_tag, add_favorite
};
use crate::utils::configs::Configs;
use crate::commands::local_manifest::{
    get_local_manifest, save_local_manifest
};
use crate::commands::methods::view::view;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Cache {
    page: usize,
    timestamp: usize,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Payload {
    page: usize,
    timestamp: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Favorite {
    source: String,
    id: String,
    tags: Vec<String>,
    current_watch_season_index: Option<usize>,
    current_watch_episode_index: Option<usize>,
    timestamp: usize,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Response {
    status: bool,
    data: Vec<Favorite>
}

async fn get_cache() -> Result<Cache, String> {
    let configs_data = Configs::get()?;

    let default_cache = Cache { page: 1, timestamp: 0 };

    let storage_dir = configs_data.storage_dir.ok_or("Storage directory not set".to_string())?;
    let cache_path = storage_dir.join("hypersync_get_favorite_cache.json");
    if cache_path.exists() {
        let cache_str = std::fs::read_to_string(&cache_path).map_err(|e| e.to_string())?;
        let cache: Cache = from_str(&cache_str).map_err(|e| e.to_string()).unwrap_or(default_cache);
        return Ok(cache);
    }else{
        return Ok(default_cache);
    }
}

async fn save_cache(cache: &Cache) -> Result<(), String> {
    let configs_data = Configs::get()?;

    let storage_dir = configs_data.storage_dir.ok_or("Storage directory not set".to_string())?;
    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }
    let cache_path = storage_dir.join("hypersync_get_favorite_cache.json");

    let cache_str = serde_json::to_string(cache).map_err(|e| e.to_string())?;
    fs::write(&cache_path, cache_str).map_err(|e| e.to_string())?;

    return Ok(());
}

async fn get_remote() -> Result<(), String> {
    let configs_data = Configs::get()?;
    /* Check if token is empty */
    /* Skip upload since not logged in yet. */
    let token: String;
    if let Some(t) = configs_data.hypersync_token {
        if t.is_empty() {
            return Ok(());
        }else{
            token = t;
        }
    } else {
        return Ok(());
    }
    /* --- */

    let hypersync_server = configs_data.hypersync_server.ok_or("HyperSync server is not set yet.")?;

    let client = Client::new();

    let mut cache_get_favorite = get_cache().await?;

    

    loop {

        let payload = Payload {
            page: cache_get_favorite.page,
            timestamp: cache_get_favorite.timestamp,
        };

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        headers.insert(
            AUTHORIZATION, 
            HeaderValue::from_str(&token)
                .map_err(|e|e.to_string())?
        );

        let url = format!("{}/api/user/favorite/get", hypersync_server);

        let response = client
            .post(url)
            .headers(headers)
            .timeout(Duration::from_secs(30))
            .json(&payload)
            .send()
            .await.map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(response.status().to_string());
        }

        let data = response.json::<Response>().await.map_err(|e| e.to_string())?.data;
        

        for favorite in &data {
            let mut local_manifest = get_local_manifest(favorite.source.to_string(), favorite.id.to_string()).await?;

            if local_manifest.manifest_data.is_none() {
                match view(favorite.source.to_string(), favorite.id.to_string(), true).await {
                    Ok(view_manifest) => {
                        local_manifest.manifest_data = view_manifest.manifest_data;
                    }
                    Err(e) => {
                        warn!("[Worker:HyperSync:Favorite::Get] Fetch manifest {} | {} error {}\n-> Skipping...", favorite.source, favorite.id, e);
                    }
                }
            }
            local_manifest.current_watch_episode_index = favorite.current_watch_episode_index;
            local_manifest.current_watch_season_index = favorite.current_watch_season_index;

            let current_timestamp = Utc::now().timestamp_millis() as usize;
            local_manifest.last_save_timestamp = Some(current_timestamp);
            save_local_manifest(favorite.source.to_string(), favorite.id.to_string(), local_manifest).await?;
            
            let tags = &favorite.tags;
            for tag in tags {
                match create_tag(tag.to_string()).await {
                    Ok(()) => {
                    }
                    Err(e) => {
                        warn!("[Worker:HyperSync:Favorite::Get] create tag {} error {}\n-> Skipping...", tag, e);
                    }
                };

                match add_favorite(tag.to_string(), favorite.source.to_string(), favorite.id.to_string()).await {
                    Ok(()) => {
                    }
                    Err(e) => {
                        warn!("[Worker:HyperSync:Favorite::Get] add favorite {} | {} | {} error {}\n-> Skipping...", tag, favorite.source, favorite.id, e);
                    }
                };
            }
        }
        
        if (data.len() == 0) && (cache_get_favorite.page == 1) {
            break;
        }

        if data.len() == 0 {
            let current_timestamp = Utc::now().timestamp_millis() as usize;
            cache_get_favorite.page = 1;
            cache_get_favorite.timestamp = current_timestamp;
            save_cache(&cache_get_favorite).await?;
            break;
        }else{
            cache_get_favorite.page += 1;
            save_cache(&cache_get_favorite).await?;
        }

    }

    Ok(())
}


pub async fn new(){
    loop {
        match get_remote().await {
            Ok(()) => {
                // info!("[Worker:HyperSync:Favorite::Get]: All tasks completed successfully.");
            }
            Err(e) => {
                error!("[Worker:HyperSync:Favorite::Get]: {}", e);
            },
        }
        sleep(Duration::from_secs(8)).await;
    }
}