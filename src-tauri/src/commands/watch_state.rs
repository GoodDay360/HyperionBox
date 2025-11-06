use serde_json::{from_reader, to_string_pretty};
use std::fs;
use std::io::BufReader;
use chrono::Utc;

use crate::models::watch_state::WatchState;
use crate::utils::configs::Configs;
use crate::commands::hypersync::watch_state::{add_watch_state_cache, get_remote_watch_state};
use crate::commands::favorite::get_tag_from_favorite;

#[tauri::command]
pub async fn get_watch_state(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
) -> Result<WatchState, String> {
    let config_data = Configs::get()?;

    let storage_dir = config_data.storage_dir.ok_or("Storage directory not set".to_string())?;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    let watch_state_dir = item_dir
        .join(&season_index.to_string())
        .join(&episode_index.to_string());
    if !watch_state_dir.exists() {
        fs::create_dir_all(&watch_state_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = watch_state_dir.join("watch_state.json");

    if !manifest_path.exists() {
        fs::write(&manifest_path, "{}").map_err(|e| e.to_string())?;
    }

    let file = fs::File::open(&manifest_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);

    let mut manifest_data: WatchState = match from_reader(reader).map_err(|e| e.to_string()) {
        Ok(data) => data,
        Err(_) => {
            WatchState::default()
        }
    };

    
    let tags = get_tag_from_favorite(source.clone(), id.clone()).await?;
    if tags.len() > 0 {
        let remote_watch_state = match get_remote_watch_state(source.clone(), id.clone(), season_index, episode_index).await {
            Ok(data) => data,
            Err(_) => None
        };
        if let Some(watch_state) = remote_watch_state {
            if let Some(timestamp) = manifest_data.timestamp {
                if watch_state.timestamp > timestamp {
                    manifest_data.current_time = Some(watch_state.current_time);
                    manifest_data.timestamp = Some(watch_state.timestamp);
                }
            }else {
                manifest_data.current_time = Some(watch_state.current_time);
                manifest_data.timestamp = Some(watch_state.timestamp);
            }
        }
    }

    return Ok(manifest_data);
}

#[tauri::command]
pub async fn save_watch_state(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
    mut watch_state: WatchState,
) -> Result<(), String> {
    let config_data = Configs::get()?;

    let storage_dir = config_data.storage_dir.ok_or("Storage directory not set".to_string())?;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    let watch_state_dir = item_dir
        .join(&season_index.to_string())
        .join(&episode_index.to_string());
    if !watch_state_dir.exists() {
        fs::create_dir_all(&watch_state_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = watch_state_dir.join("watch_state.json");
    let current_timestamp = Utc::now().timestamp_millis() as usize;
    watch_state.timestamp = Some(current_timestamp);

    let local_manifest_data_to_string =
        to_string_pretty(&watch_state).map_err(|e| e.to_string())?;
    fs::write(&manifest_path, local_manifest_data_to_string).map_err(|e| e.to_string())?;


    if let Some(current_time) = watch_state.current_time {
        let tags = get_tag_from_favorite(source.clone(), id.clone()).await?;
        if tags.len() > 0 {
            add_watch_state_cache(source, id, season_index, episode_index, current_time).await?;
        }
    }
    

    return Ok(());
}
