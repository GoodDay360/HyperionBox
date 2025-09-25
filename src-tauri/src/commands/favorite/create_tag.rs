use rusqlite::{Connection, Result};
use std::fs;
use serde_json::{from_str};

use crate::utils::configs;
use crate::commands::local_manifest::{get_local_manifest};
use crate::models::view::ViewData;

pub fn get_all_tag() -> Result<Vec<String>, String> {
    let config_data = configs::get()?;
    let storage_dir = config_data.storage_dir;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let favorite_db_path = storage_dir.join("favorite.db");

    let conn = Connection::open(&favorite_db_path).map_err(|e| e.to_string())?;

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


pub fn create_tag(tag_name: String) -> Result<(), String> {
    let config_data = configs::get()?;
    let storage_dir = config_data.storage_dir;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let favorite_db_path = storage_dir.join("favorite.db");

    // Open or create the SQLite database file
    let conn = Connection::open(&favorite_db_path).map_err(|e| e.to_string())?;

    // Create the table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tag (
            tag_name TEXT NOT NULL UNIQUE
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Insert the tag_name
    conn.execute(
        "INSERT INTO tag (tag_name) VALUES (?1)",
        [&tag_name],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_favorite(tag_name: String) -> Result<Vec<(String, String)>, String> {
    let config_data = configs::get()?;
    let storage_dir = config_data.storage_dir;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let favorite_db_path = storage_dir.join("favorite.db");

    let conn = Connection::open(&favorite_db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT source, id FROM favorite WHERE tag_name = ?1")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([&tag_name], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

pub async fn add_favorite(tag_name: String, source: String, id: String, view_data: String) -> Result<(), String> {
    let config_data = configs::get()?;
    let storage_dir = config_data.storage_dir;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let favorite_db_path = storage_dir.join("favorite.db");

    let conn = Connection::open(&favorite_db_path).map_err(|e| e.to_string())?;

    // Create the favorite table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS favorite (
            tag_name TEXT NOT NULL,
            source TEXT NOT NULL,
            id TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Insert the favorite record
    conn.execute(
        "INSERT INTO favorite (tag_name, source, id) VALUES (?1, ?2, ?3)",
        [&tag_name, &source, &id],
    ).map_err(|e| e.to_string())?;

    let local_manifest = get_local_manifest(source.clone(), id.clone())?;

    // let view_data =
    let view_data_json: ViewData = from_str(&view_data).map_err(|e| e.to_string())?;


    Ok(())
}