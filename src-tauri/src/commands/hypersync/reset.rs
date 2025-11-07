use chrono::Utc;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use serde_json::{to_string};

use crate::utils::configs::Configs;

use crate::commands::hypersync::favorite;
use crate::commands::hypersync::watch_state;

#[tauri::command]
pub async fn reset_hypersync_cache() -> Result<(), String> {
    let fav_conn = favorite::get_db()?;
    fav_conn.execute("
        DELETE FROM favorite_cache
    ", [],)
        .map_err(|e| e.to_string())?;

    let ws_conn = watch_state::get_db()?;
    ws_conn.execute("
        DELETE FROM watch_state_cache
    ", [],)
        .map_err(|e| e.to_string())?;


    let configs_data = Configs::get()?;

    let storage_dir = configs_data.storage_dir.ok_or("Storage directory not set".to_string())?;
    let cache_path = storage_dir.join("hypersync_get_favorite_cache.json");
    if cache_path.exists() {
        fs::remove_file(&cache_path).map_err(|e| e.to_string())?;
    }

    Ok(())
}