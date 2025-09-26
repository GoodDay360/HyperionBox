
use std::fs;
use std::io::BufReader;
use serde_json::{to_string_pretty, from_reader};

use crate::utils::configs;
use crate::models::watch_state::{WatchState};

#[tauri::command]
pub async fn get_watch_state(source: String, id: String, season_index: usize, episode_index: usize) -> Result<WatchState, String> {
    let config_data = configs::get()?;

    let storage_dir = config_data.storage_dir;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    let watch_state_dir = item_dir.join(&season_index.to_string()).join(&episode_index.to_string());
    if !watch_state_dir.exists() {
        fs::create_dir_all(&watch_state_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = watch_state_dir.join("watch_state.json");

    if !manifest_path.exists() {
        fs::write(&manifest_path, "{}").map_err(|e| e.to_string())?;
    }

    let file = fs::File::open(&manifest_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);

    let manifest_data: WatchState;
    match from_reader::<BufReader<std::fs::File>, WatchState>(reader).map_err(|e| e.to_string()) {
        Ok(data) => manifest_data = data,
        Err(_) => {
            manifest_data = WatchState::default();
        }
    }

    return Ok(manifest_data);
}

#[tauri::command]
pub async fn save_watch_state(source: String, id: String, season_index: usize, episode_index: usize, watch_state: WatchState) -> Result<(), String> {
    let config_data = configs::get()?;

    let storage_dir = config_data.storage_dir;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    let watch_state_dir = item_dir.join(&season_index.to_string()).join(&episode_index.to_string());
    if !watch_state_dir.exists() {
        fs::create_dir_all(&watch_state_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = watch_state_dir.join("watch_state.json");


    let local_manifest_data_to_string = to_string_pretty(&watch_state).map_err(|e| e.to_string())?;
    fs::write(&manifest_path, local_manifest_data_to_string).map_err(|e| e.to_string())?;

    return Ok(());
}

