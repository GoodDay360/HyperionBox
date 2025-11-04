use tracing::{error};
use std::fs;
use std::io::BufReader;
use serde_json::{from_reader, to_string};
use chrono::Utc;

use crate::sources::anime;
use crate::sources::movie;
use crate::commands::favorite::{get_recent_from_favorite};
use crate::commands::local_manifest::{get_local_manifest};
use crate::utils::configs::Configs;
use crate::utils::convert_file_src;
use crate::models::home::{Content, ContentData, HomeData};

const CACHE_DELAY: usize = 3 * 60 * 60 * 1000; // In milliseconds

async fn get_cache(source: &str) -> Result<Option<HomeData>, String> {
    let app_config = Configs::get()?;
    
    let cache_dir = app_config.cache_dir.ok_or("Cache dir not set!")?;

    let home_cache_path = cache_dir.join(&format!("home_{}.json", source));

    if  home_cache_path.exists() {
        let file = fs::File::open(& home_cache_path).map_err(|e| e.to_string())?;
        let reader = BufReader::new(file);
        match from_reader::<BufReader<std::fs::File>, HomeData>(reader) {
            Ok(data) => return Ok(Some(data)),
            Err(_) => {
                return Ok(None)
            }
        }
    }
    
    return Ok(None);
}

async fn save_cache(source: &str, data: &HomeData) -> Result<(), String> {
    let app_config = Configs::get()?;
    let cache_dir = app_config.cache_dir.ok_or("Cache dir not set!")?;

    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    let home_cache_path = cache_dir.join(&format!("home_{}.json", source));
    
    let data_to_string = to_string(&data).map_err(|e| e.to_string())?;
    fs::write(&home_cache_path, data_to_string).map_err(|e| e.to_string())?;
    
    return Ok(());
}

#[tauri::command]
pub async fn home(source: String, force_remote: bool) -> Result<HomeData, String> {
    let mut home_data: HomeData = HomeData {
        relevant_content: vec![],
        content: vec![],
        last_save_timestamp: 0,
    };

    let mut should_fetch_remote: bool = true;

    if !force_remote {
        if let Some(cache_home_data) = get_cache(&source).await?{
            let current_timestamp: usize = Utc::now().timestamp_millis() as usize;
            if (current_timestamp - cache_home_data.last_save_timestamp) < CACHE_DELAY {
                home_data = cache_home_data;
                should_fetch_remote = false;
            }
        }
    }

    if should_fetch_remote {
        if source == "anime" {
            match anime::home::new(&source).await {
                Ok(data) => home_data = data,
                Err(e) => {
                    error!("[HOME] Error: {}", e);
                }
            }
        }else if source == "movie" {
            match movie::home::new(&source).await {
                Ok(data) => home_data = data,
                Err(e) => {
                    error!("[HOME] Error: {}", e);
                }
            }
        }else{
            return Err("Unkown Source".to_string());
        }

        save_cache(&source, &home_data).await?;
    }
    

    /* Load Recent Watch */
    let app_configs = Configs::get()?;
    let storage_dir = app_configs.storage_dir.ok_or("Storage directory not set".to_string())?;
    let content_data = &mut home_data.content;

    let mut recent_content_data: Vec<ContentData> = vec![];
    let recent_from_favorite = get_recent_from_favorite(15).await?;
    for item in recent_from_favorite {
        let local_manifest = get_local_manifest(item.source.clone(), item.id.to_string()).await?;
        match local_manifest.manifest_data {
            Some(data) => {
                let item_dir = storage_dir.join(&source).join(&item.id);
                let poster_path = item_dir.join("poster.png");

                let poster: String;

                if poster_path.exists() {
                    poster = convert_file_src::new(&poster_path)?;
                }else{
                    poster = data.poster;
                }

                let new_content = ContentData {
                    source: item.source,
                    id: item.id.to_string().clone(),
                    title: data.title,
                    poster,
                };
                recent_content_data.push(new_content);
            }
            None => {
                let new_content = ContentData {
                    source: item.source,
                    id: item.id.to_string().clone(),
                    title: "?".to_string(),
                    poster: "".to_string(),
                };
                recent_content_data.push(new_content);
            }
        }
    }

    if recent_content_data.len() > 0 {
        content_data.insert(
            0,
            Content {
                label: "Continue Watching".to_string(),
                data: recent_content_data,
            },
        );
    }
    /* --- */

    return Ok(home_data);
}



