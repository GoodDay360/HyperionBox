use chrono::Utc;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use serde_json::{to_string};
use tracing::{info};
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, AUTHORIZATION};

use crate::utils::configs::Configs;

use crate::commands::local_manifest::{get_local_manifest};
use crate::commands::favorite::{get_tag_from_favorite};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HyperSyncCache {
    pub source: String,
    pub id: String,
    pub season_index: usize,
    pub episode_index: usize,
    pub current_time: f64,
    pub timestamp: usize,
}


#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RemoteWatchStatePayload {
    pub source: String,
    pub id: String,
    pub season_index: usize,
    pub episode_index: usize,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RemoteWatchStateResponse {
    pub status: bool,
    pub current_time: f64,
    pub timestamp: usize,
}



pub fn get_db() -> Result<Connection, String> {
    let config_data = Configs::get()?;
    let cache_dir = config_data.cache_dir.ok_or("Storage directory not set".to_string())?;

    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    let db_path = cache_dir.join("hypersync.db");

    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    /* Table for cache upload to HyperSync Server */
    conn.execute("CREATE TABLE IF NOT EXISTS watch_state_cache (
        source TEXT NOT NULL,
        id TEXT NOT NULL,
        season_index INT,
        episode_index INT,
        current_time REAL NOT NULL,
        timestamp BIGINT NOT NULL,
        UNIQUE(source, id, season_index, episode_index)
    )",[],)
    .map_err(|e| e.to_string())?;

    /* --- */

    Ok(conn)
}

#[tauri::command]
pub async fn get_all_watch_state_cache() -> Result<Vec<HyperSyncCache>, String> {
    let conn = get_db()?;
    info!("get_all_watch_state_cache");
    let mut stmt = conn
        .prepare("SELECT 
            source, 
            id, 
            season_index, 
            episode_index, 
            watch_state_cache.current_time,
            timestamp 
            FROM watch_state_cache ORDER BY timestamp ASC
        ")
        .map_err(|e| e.to_string())?;


    let result = stmt.query_map([], |row| {
        Ok(HyperSyncCache {
            source: row.get(0)?,
            id: row.get(1)?,
            season_index: row.get(2)?,
            episode_index: row.get(3)?,
            current_time: row.get(4)?,
            timestamp: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let data: Result<Vec<_>, _> = result
        .map(|r| r.map_err(|e| e.to_string()))
        .collect();

    
    return data;

}

#[tauri::command]
pub async fn add_watch_state_cache(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
    current_time: f64
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


    let current_timestamp = Utc::now().timestamp_millis();

    let conn = get_db()?;

    conn.execute(
    "
        INSERT OR REPLACE INTO watch_state_cache (
            source, id, 
            season_index, 
            episode_index,
            current_time,
            timestamp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    ",
        rusqlite::params![
            source,
            id,
            season_index,
            episode_index,
            current_time,
            current_timestamp
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn clear_watch_state_cache(
    source: String, id: String, 
    season_index: usize, 
    episode_index: usize, 
    timestamp: usize
) -> Result<(), String> {
    let conn = get_db()?;

    conn.execute("
        DELETE FROM watch_state_cache
        WHERE source = ?1 AND id = ?2 AND season_index = ?3 AND episode_index = ?4 AND timestamp <= ?5
    ", params![source, id, season_index, episode_index, timestamp],)
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn get_remote_watch_state(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
) -> Result<Option<RemoteWatchStateResponse>, String> {
    let configs_data = Configs::get()?;

    /* Check if token is empty */
    /* Skip get since not logged in yet. */
    let token: String;
    if let Some(t) = configs_data.hypersync_token {
        if t.is_empty() {
            return Ok(None);
        }else{
            token = t;
        }
    } else {
        return Ok(None);
    }
    /* --- */
    
    let hypersync_server = configs_data.hypersync_server.ok_or("HyperSync server is not set yet.")?;

    let client = Client::new();

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(
        AUTHORIZATION, 
        HeaderValue::from_str(&token)
            .map_err(|e|e.to_string())?
    );

    let payload: RemoteWatchStatePayload = RemoteWatchStatePayload {
        source,
        id,
        season_index,
        episode_index,
    };

    let url = format!("{}/api/user/watch_state/get", hypersync_server);

    let response = client
        .post(url)
        .headers(headers)
        .json(&payload)
        .send()
        .await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(response.status().to_string());
    }

    let remote_watch_state: RemoteWatchStateResponse = response.json().await.map_err(|e| e.to_string())?;

    return Ok(Some(remote_watch_state));

}