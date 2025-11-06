use tokio::{time::{sleep, Duration}};
use tracing::{error};
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, AUTHORIZATION};
use serde::{Deserialize, Serialize};
use serde_json::{from_str};
use chrono::Utc;

use crate::commands::hypersync::favorite::{
    clear_favorite_cache, get_all_favorite_cache
};
use crate::utils::configs::Configs;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Payload {
    source: String,
    id: String,
    tags: Vec<String>,
    current_watch_season_index: Option<usize>,
    current_watch_episode_index: Option<usize>,
    timestamp: usize,
}
async fn upload() -> Result<(), String> {
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

    let favorite_cache = get_all_favorite_cache().await?;
    let client = Client::new();

    let current_timestamp = Utc::now().timestamp_millis() as usize;

    for favorite in favorite_cache {
        let payload = Payload {
            source: favorite.source.clone(),
            id: favorite.id.clone(),
            tags: from_str(&favorite.tags).map_err(|e| e.to_string())?,
            current_watch_season_index: favorite.current_watch_season_index,
            current_watch_episode_index: favorite.current_watch_episode_index,
            timestamp: favorite.timestamp as usize,
        };

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        headers.insert(
            AUTHORIZATION, 
            HeaderValue::from_str(&token)
                .map_err(|e|e.to_string())?
        );

        let url = format!("{}/api/user/favorite/add", hypersync_server);

        let response = client
            .post(url)
            .headers(headers)
            .json(&payload)
            .send()
            .await.map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(response.status().to_string());
        }

        clear_favorite_cache(favorite.source, favorite.id, current_timestamp).await?;
    }


    Ok(())
}


pub async fn new(){
    loop {
        match upload().await {
            Ok(()) => {
                // info!("[Worker:HyperSync:Favorite]: All tasks completed successfully.");
            }
            Err(e) => {
                error!("[Worker:HyperSync:Favorite]: {}", e);
                sleep(Duration::from_secs(10)).await;
            },
        }
        sleep(Duration::from_secs(5)).await;
    }
}