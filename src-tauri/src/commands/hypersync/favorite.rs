use chrono::Utc;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use serde_json::{to_string};

use crate::utils::configs::Configs;

use crate::commands::local_manifest::{get_local_manifest};
use crate::commands::favorite::{get_tag_from_favorite, get_all_item_from_favorite};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HyperSyncCache {
    pub source: String,
    pub id: String,
    pub tags: String,
    pub link_plugin_id: Option<String>,
    pub link_id: Option<String>,
    pub current_watch_season_index: Option<usize>,
    pub current_watch_episode_index: Option<usize>,
    pub timestamp: i64,
}

pub fn get_db() -> Result<Connection, String> {
    let config_data = Configs::get()?;
    let storage_dir = config_data.storage_dir.ok_or("Storage directory not set".to_string())?;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let db_path = storage_dir.join("hypersync.db");

    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    /* Table for cache upload to HyperSync Server */
    conn.execute("
        CREATE TABLE IF NOT EXISTS favorite_cache (
        source TEXT NOT NULL,
        id TEXT NOT NULL,
        tags TEXT NOT NULL,
        link_plugin_id TEXT,
        link_id TEXT,
        current_watch_season_index INT,
        current_watch_episode_index INT,
        timestamp BIGINT NOT NULL,
        UNIQUE(source, id)
    )",[],)
    .map_err(|e| e.to_string())?;

    /* --- */

    Ok(conn)
}

#[tauri::command]
pub async fn get_all_favorite_cache() -> Result<Vec<HyperSyncCache>, String> {
    let conn = get_db()?;
    
    let mut stmt = conn
        .prepare("
            SELECT 
            source, id, tags, 
            link_plugin_id, link_id, 
            current_watch_season_index, current_watch_episode_index, 
            timestamp FROM favorite_cache ORDER BY timestamp ASC
        ")
        .map_err(|e| e.to_string())?;


    let result = stmt.query_map([], |row| {
        Ok(HyperSyncCache {
            source: row.get(0)?,
            id: row.get(1)?,
            tags: row.get(2)?,
            link_plugin_id: row.get(3)?,
            link_id: row.get(4)?,
            current_watch_season_index: row.get(5)?,
            current_watch_episode_index: row.get(6)?,
            timestamp: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let data: Result<Vec<_>, _> = result
        .map(|r| r.map_err(|e| e.to_string()))
        .collect();

    return data;

    
}

#[tauri::command]
pub async fn add_favorite_cache(
    source: String,
    id: String,
) -> Result<(), String> {
    let configs_data = Configs::get()?;

    /* Check if token is empty */
    /* Skip add to cache since not logged in yet. */
    if let Some(token) = configs_data.hypersync_token {
        if token.is_empty() {
            return Ok(());
        }
    }else {
        return Ok(());
    }
    /* --- */

    let tags = get_tag_from_favorite(source.clone(), id.clone()).await?;
    let tags_to_string = to_string(&tags).map_err(|e| e.to_string())?;

    let local_manifest = get_local_manifest(source.clone(), id.clone()).await?;

    let link_plugin_id = match &local_manifest.link_plugin {
        Some(link_plugin) => link_plugin.plugin_id.clone(),
        None => None,
    };

    let link_id = match &local_manifest.link_plugin {
        Some(link_plugin) => link_plugin.id.clone(),
        None => None,
    };

    let current_watch_season_index = local_manifest.current_watch_season_index;
    let current_watch_episode_index = local_manifest.current_watch_episode_index;

    let current_timestamp = Utc::now().timestamp_millis();

    let conn = get_db()?;

    conn.execute(
    "
        INSERT OR REPLACE INTO favorite_cache (
            source, id, tags,
            link_plugin_id, link_id,
            current_watch_season_index, current_watch_episode_index,
            timestamp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    ",
        rusqlite::params![
            source,
            id,
            tags_to_string,
            link_plugin_id,
            link_id,
            current_watch_season_index,
            current_watch_episode_index,
            current_timestamp
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn upload_all_local_favorite() -> Result<(), String> {
    let local_favorite = get_all_item_from_favorite()?;

    for favorite in local_favorite {
        add_favorite_cache(favorite.source, favorite.id).await?;
    }

    return Ok(());
}

pub async fn clear_favorite_cache(source: String, id: String, timestamp: usize) -> Result<(), String> {
    let conn = get_db()?;

    conn.execute("
        DELETE FROM favorite_cache
        WHERE source = ?1 AND id = ?2 AND timestamp <= ?3
    ", params![source, id, timestamp],)
        .map_err(|e| e.to_string())?;

    Ok(())
}

