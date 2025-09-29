use rusqlite::{Connection, Result, params};
use std::fs;

use crate::utils::configs;

pub fn get_db() -> Result<Connection, String> {
    let config_data = configs::get()?;
    let storage_dir = config_data.storage_dir;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let favorite_db_path = storage_dir.join("download.db");

    let conn = Connection::open(&favorite_db_path).map_err(|e| e.to_string())?;


    conn.execute("
        CREATE TABLE IF NOT EXISTS download (
            source TEXT NOT NULL,
            id TEXT NOT NULL,
            plugin_id TEXT NOT NULL,
            season_index INT NOT NULL,
            episode_index INT NOT NULL,
            episode_id TEXT NOT NULL,
            prefer_server_type TEXT NOT NULL,
            prefer_server_index INT NOT NULL,
            prefer_quality INT NOT NULL,
            pause INT NOT NULL DEFAULT 0,
            error INT NOT NULL DEFAULT 0,
            done INT NOT NULL DEFAULT 0
        )
    ",[]).map_err(|e| e.to_string())?;

    Ok(conn)
}


#[tauri::command]
pub async fn add_download(
    source: String,
    id: String,
    plugin_id: String,
    season_index: usize,
    episode_index: usize,
    episode_id: String,
    prefer_server_type: String,
    prefer_server_index: usize,
    prefer_quality: usize,
) -> Result<(), String> {
    let conn = get_db()?;

    // Check if the record already exists
    let exists: bool = conn.query_row(
        "SELECT EXISTS(
            SELECT 1 FROM download
            WHERE source = ?1 AND id = ?2 AND plugin_id = ?3
            AND season_index = ?4 AND episode_index = ?5
        )",
        params![source, id, plugin_id, season_index, episode_index],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    if exists {
        // Skip insertion
        return Ok(());
    }

    // Insert new record
    conn.execute(
        "INSERT INTO download (
            source, id, plugin_id, season_index, episode_index, episode_id,
            prefer_server_type, prefer_server_index, prefer_quality
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            source,
            id,
            plugin_id,
            season_index,
            episode_index,
            episode_id,
            prefer_server_type,
            prefer_server_index,
            prefer_quality
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}
