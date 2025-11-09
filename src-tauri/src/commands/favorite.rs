use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::fs;

use crate::utils::configs::Configs;
use crate::commands::hypersync::favorite::{
    add_favorite_cache
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ItemFromFavorite {
    pub source: String,
    pub id: String,
    pub timestamp: usize,
}


pub fn get_db() -> Result<Connection, String> {
    let config_data = Configs::get()?;
    let storage_dir = config_data.storage_dir.ok_or("Storage directory not set".to_string())?;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let favorite_db_path = storage_dir.join("favorite.db");

    let conn = Connection::open(&favorite_db_path).map_err(|e| e.to_string())?;

    // Ensure the table exists
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tag (
            tag_name TEXT NOT NULL UNIQUE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS favorite (
            tag_name TEXT NOT NULL,
            source TEXT NOT NULL,
            id TEXT NOT NULL,
            timestamp BIGINT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    /* Table for cache upload to HyperSync Server */
    conn.execute(
        "CREATE TABLE IF NOT EXISTS favorite_cache (
            source TEXT NOT NULL,
            id TEXT NOT NULL,
            tags TEXT NOT NULL,
            link_plugin_id TEXT,
            link_id TEXT,
            current_watch_season_index INT NOT NULL,
            current_watch_episode_index INT NOT NULL,
            timestamp BIGINT NOT NULL,
            UNIQUE(source, id)
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    /* --- */

    Ok(conn)
}

#[tauri::command]
pub async fn create_tag(tag_name: String) -> Result<(), String> {
    let conn = get_db()?;

    // Insert the tag_name
    conn.execute("INSERT INTO tag (tag_name) VALUES (?1)", [&tag_name])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_all_tag() -> Result<Vec<String>, String> {
    let conn = get_db()?;

    let mut stmt = conn
        .prepare("SELECT tag_name FROM tag")
        .map_err(|e| e.to_string())?;

    let tag_iter = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for tag_result in tag_iter {
        tags.push(tag_result.map_err(|e| e.to_string())?);
    }

    Ok(tags)
}

#[tauri::command]
pub async fn rename_tag(old_tag: String, new_tag: String) -> Result<(), String> {
    let conn = get_db()?;

    // Update the tag name
    let rows_updated = conn
        .execute(
            "UPDATE tag SET tag_name = ?1 WHERE tag_name = ?2",
            [&new_tag, &old_tag],
        )
        .map_err(|e| e.to_string())?;

    if rows_updated == 0 {
        return Err(format!("Tag '{}' not found", old_tag));
    }

    conn.execute(
        "UPDATE favorite SET tag_name = ?1 WHERE tag_name = ?2",
        [&new_tag, &old_tag],
    )
    .map_err(|e| e.to_string())?;

    let tags = get_item_from_favorite(new_tag.clone())?;
    for tag in tags {
        add_favorite_cache(tag.source, tag.id).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn remove_tag(tag_name: String) -> Result<(), String> {
    let conn = get_db()?;

    // Delete the tag
    let rows_deleted = conn
        .execute("DELETE FROM tag WHERE tag_name = ?1", [&tag_name])
        .map_err(|e| e.to_string())?;

    if rows_deleted == 0 {
        return Err(format!("Tag '{}' not found", tag_name));
    }

    conn.execute("DELETE FROM favorite WHERE tag_name = ?1", [&tag_name])
        .map_err(|e| e.to_string())?;


    let tags = get_item_from_favorite(tag_name.clone())?;
    for tag in tags {
        add_favorite_cache(tag.source, tag.id).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn add_favorite(tag_name: String, source: String, id: String) -> Result<(), String> {
    let conn = get_db()?;

    // Check if the favorite already exists
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM favorite WHERE tag_name = ?1 AND source = ?2 AND id = ?3)",
            params![tag_name, source, id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if exists {
        return Err("Favorite already exists.".to_string());
    }

    // Insert the favorite record
    conn.execute(
        "INSERT INTO favorite (tag_name, source, id, timestamp) VALUES (?1, ?2, ?3, ?4)",
        params![tag_name, source, id, 0],
    )
    .map_err(|e| e.to_string())?;

    add_favorite_cache(source, id).await?;

    Ok(())
}

#[tauri::command]
pub async fn get_recent_from_favorite(limit: usize) -> Result<Vec<ItemFromFavorite>, String> {
    let conn = get_db()?;

    let mut stmt = conn
        .prepare(
            "SELECT source, id, MAX(timestamp) as timestamp
                FROM favorite
                GROUP BY source, id
                ORDER BY timestamp DESC
                LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([limit], |row| {
            Ok(ItemFromFavorite {
                source: row.get(0)?,
                id: row.get(1)?,
                timestamp: row.get::<_, usize>(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
pub async fn get_tag_from_favorite(source: String, id: String) -> Result<Vec<String>, String> {
    let conn = get_db()?;

    // Prepare the query
    let mut stmt = conn
        .prepare("SELECT tag_name FROM favorite WHERE source = ?1 AND id = ?2")
        .map_err(|e| e.to_string())?;

    // Collect matching tag names
    let tags = stmt
        .query_map(params![source, id], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<String>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(tags)
}

#[tauri::command]
pub fn get_item_from_favorite(tag_name: String) -> Result<Vec<ItemFromFavorite>, String> {
    let conn = get_db()?;

    let mut stmt = conn
        .prepare(
            "
            SELECT source, id, timestamp FROM favorite
            WHERE tag_name = ?1
            ORDER BY timestamp DESC
        ",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(params![tag_name], |row| {
            Ok(ItemFromFavorite {
                source: row.get(0)?,
                id: row.get(1)?,
                timestamp: row.get::<_, usize>(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}


pub fn get_all_item_from_favorite() -> Result<Vec<ItemFromFavorite>, String> {
    let conn = get_db()?;

    let mut stmt = conn
        .prepare(
            "SELECT source, id, timestamp
                FROM favorite
                GROUP BY source, id, timestamp",
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([], |row| {
            Ok(ItemFromFavorite {
                source: row.get(0)?,
                id: row.get(1)?,
                timestamp: row.get::<_, i64>(2)? as usize,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(items)
}

#[tauri::command]
pub async fn update_timestamp_favorite(source: String, id: String, timestamp: usize) -> Result<(), String> {
    let conn = get_db()?; // Reuse your existing get_db function

    conn.execute(
        "UPDATE favorite SET timestamp = ?1 WHERE source = ?2 AND id = ?3",
        rusqlite::params![timestamp, source, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn remove_favorite(tag_name: String, source: String, id: String) -> Result<(), String> {
    let conn = get_db()?;

    // Delete the favorite record
    conn.execute(
        "DELETE FROM favorite WHERE tag_name = ?1 AND source = ?2 AND id = ?3",
        params![tag_name, source, id],
    )
    .map_err(|e| e.to_string())?;

    add_favorite_cache(source, id).await?;

    Ok(())
}

#[tauri::command]
pub async fn full_remove_favorite(source: String, id: String) -> Result<(), String> {
    let conn = get_db()?;

    conn.execute(
        "DELETE FROM favorite WHERE source = ?1 AND id = ?2",
        params![source, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

