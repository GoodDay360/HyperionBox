use rusqlite::{params, Connection, Result};
use std::collections::HashMap;
use std::fs;
use tauri::async_runtime;

use chlaty_core::request_plugin::get_server::ServerResult;

use crate::models::download::{Download, DownloadItem, Episode, GetDownload};
use crate::utils::configs;

use crate::commands::local_manifest::{ get_local_manifest, save_local_manifest };
use crate::worker::download::{CurrentDownloadStatus, CURRENT_DOWNLOAD_STATUS};

pub fn get_db() -> Result<Connection, String> {
    let config_data = configs::get()?;
    let storage_dir = config_data.storage_dir;

    if !storage_dir.exists() {
        fs::create_dir_all(&storage_dir).map_err(|e| e.to_string())?;
    }

    let favorite_db_path = storage_dir.join("download.db");

    let conn = Connection::open(&favorite_db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS download (
            source TEXT NOT NULL,
            id TEXT NOT NULL,
            plugin_id TEXT NOT NULL,
            pause INT NOT NULL DEFAULT 0
        )
    ",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "
        CREATE TABLE IF NOT EXISTS download_item (
            source TEXT NOT NULL,
            id TEXT NOT NULL,
            season_index INT NOT NULL,
            episode_index INT NOT NULL,
            episode_id TEXT NOT NULL,
            prefer_server_type TEXT NOT NULL,
            prefer_server_index INT NOT NULL,
            prefer_quality INT NOT NULL,
            error INT NOT NULL DEFAULT 0,
            done INT NOT NULL DEFAULT 0
        )
    ",
        [],
    )
    .map_err(|e| e.to_string())?;

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

    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(
            SELECT 1 FROM download
            WHERE source = ?1 AND id = ?2
        )",
            params![source, id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if !exists {
        conn.execute(
            "INSERT INTO download (source, id, plugin_id) VALUES (?1, ?2, ?3)",
            params![&source, &id, &plugin_id],
        )
        .map_err(|e| e.to_string())?;
    }

    let item_exists: bool = conn
        .query_row(
            "SELECT EXISTS(
            SELECT 1 FROM download_item
            WHERE source = ?1 AND id = ?2
            AND season_index = ?3 AND episode_index = ?4
        )",
            params![source, id, season_index, episode_index],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if item_exists {
        return Ok(());
    }

    conn.execute(
        "INSERT INTO download_item (
            source, id, season_index, episode_index, episode_id,
            prefer_server_type, prefer_server_index, prefer_quality
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            source,
            id,
            season_index,
            episode_index,
            episode_id,
            prefer_server_type,
            prefer_server_index,
            prefer_quality
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_download() -> Result<HashMap<String, GetDownload>, String> {
    /* Get download data from download table */
    let download: Result<Vec<Download>, String> = async_runtime::spawn_blocking(|| {
        let conn = get_db()?;
        let mut stmt = conn
            .prepare(
                "
            SELECT
                source,
                id,
                plugin_id,
                pause
            FROM download
        ",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![], |row| {
                Ok(Download {
                    source: row.get(0)?,
                    id: row.get(1)?,
                    plugin_id: row.get(2)?,
                    pause: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut results: Vec<Download> = vec![];
        for row in rows {
            results.push(row.map_err(|e| e.to_string())?);
        }
        Ok(results)
    })
    .await
    .map_err(|e| e.to_string())?;
    /* --- */

    /* Map through each source, id and get download_item data */
    let mut results: HashMap<String, GetDownload> = HashMap::new();

    for row_download in download? {
        let local_manifest =
            get_local_manifest(row_download.source.clone(), row_download.id.clone()).await?;

        let mut title: String = "?".to_string();
        let mut poster: String = "".to_string();
        if let Some(manifest_data) = local_manifest.manifest_data {
            title = manifest_data.title;
            poster = manifest_data.poster;
        }
        results.insert(
            row_download.id.clone(),
            GetDownload {
                source: row_download.source.clone(),
                id: row_download.id.clone(),
                title: title,
                poster: poster,
                seasons: HashMap::new(),
                pause: if row_download.pause == 1 { true } else { false },
                max: 0,
                finished: 0,
            },
        );

        let conn = get_db()?;
        let mut stmt = conn
            .prepare(
                "
            SELECT
                source,
                id,
                season_index,
                episode_index,
                episode_id,
                prefer_server_type,
                prefer_server_index,
                prefer_quality,
                error,
                done
            FROM download_item
            WHERE source = ?1 AND id = ?2
        ",
            )
            .map_err(|e| e.to_string())?;

        let download_item_rows = stmt
            .query_map(params![row_download.source, row_download.id], |row| {
                Ok(DownloadItem {
                    source: row.get(0)?,
                    id: row.get(1)?,
                    season_index: row.get(2)?,
                    episode_index: row.get(3)?,
                    episode_id: row.get(4)?,
                    prefer_server_type: row.get(5)?,
                    prefer_server_index: row.get(6)?,
                    prefer_quality: row.get(7)?,
                    error: row.get(8)?,
                    done: row.get(9)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for row in download_item_rows {
            let download_item_row = row.map_err(|e| e.to_string())?;
            let item = results
                .get_mut(&download_item_row.id)
                .ok_or("no seasons index even after insert.")?;

            if !item.seasons.contains_key(&download_item_row.season_index) {
                item.seasons
                    .insert(download_item_row.season_index, HashMap::new());
            }

            let item_season = item
                .seasons
                .get_mut(&download_item_row.season_index)
                .ok_or("no episodes index even after insert.")?;

            if !item_season.contains_key(&download_item_row.episode_index) {
                item_season.insert(
                    download_item_row.episode_index,
                    Episode {
                        error: if download_item_row.error == 1 {
                            true
                        } else {
                            false
                        },
                        done: if download_item_row.done == 1 {
                            true
                        } else {
                            false
                        },
                    },
                );
                item.max += 1;
                if download_item_row.done == 1 {
                    item.finished += 1;
                }
            }
        }
    }
    /* --- */

    return Ok(results);
}

#[tauri::command]
pub async fn remove_download(source: String, id: String) -> Result<(), String> {
    let configs_data = configs::get()?;
    let storage_dir = configs_data.storage_dir;

    let conn = get_db()?;

    /* Delete all local download files */
    let mut stmt = conn
        .prepare(
            "
        SELECT
            source,
            id,
            season_index,
            episode_index,
            episode_id,
            prefer_server_type,
            prefer_server_index,
            prefer_quality,
            error,
            done
        FROM download_item
        WHERE source = ?1 AND id = ?2
    ",
        )
        .map_err(|e| e.to_string())?;

    let download_item_rows = stmt
        .query_map(params![&source, &id], |row| {
            Ok(DownloadItem {
                source: row.get(0)?,
                id: row.get(1)?,
                season_index: row.get(2)?,
                episode_index: row.get(3)?,
                episode_id: row.get(4)?,
                prefer_server_type: row.get(5)?,
                prefer_server_index: row.get(6)?,
                prefer_quality: row.get(7)?,
                error: row.get(8)?,
                done: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;
    for row in download_item_rows {
        let row_data = row.map_err(|e| e.to_string())?;
        let download_dir = storage_dir
            .join(&row_data.source)
            .join(&row_data.id)
            .join(&row_data.season_index.to_string())
            .join(&row_data.episode_index.to_string())
            .join("download");

        if download_dir.exists() {
            fs::remove_dir_all(download_dir).map_err(|e| e.to_string())?;
        }
    }
    /* --- */

    // Delete from download_item first to avoid foreign key constraint issues
    conn.execute(
        "DELETE FROM download_item WHERE source = ?1 AND id = ?2",
        params![source, id],
    )
    .map_err(|e| e.to_string())?;

    // Then delete from download
    conn.execute(
        "DELETE FROM download WHERE source = ?1 AND id = ?2",
        params![source, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn remove_download_item(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
) -> Result<(), String> {
    let configs_data = configs::get()?;
    let storage_dir = configs_data.storage_dir;

    let conn = get_db()?;

    let download_dir = storage_dir
        .join(&source)
        .join(&id)
        .join(&season_index.to_string())
        .join(&episode_index.to_string())
        .join("download");

    if download_dir.exists() {
        fs::remove_dir_all(download_dir).map_err(|e| e.to_string())?;
    }

    /* --- */

    conn.execute(
        "DELETE FROM download_item WHERE source = ?1 AND id = ?2 AND season_index = ?3 AND episode_index = ?4",
        params![&source, &id, season_index, episode_index],
    ).map_err(|e| e.to_string())?;

    let count = count_download_item(source.clone(), id.clone()).await?;

    if count == 0 {
        remove_download(source, id).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn count_download_item(source: String, id: String) -> Result<usize, String> {
    let conn = get_db()?;
    conn.query_row(
        "SELECT COUNT(*) FROM download_item WHERE source = ?1 AND id = ?2",
        params![source, id],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_pause_download(source: String, id: String, pause: bool) -> Result<(), String> {
    let conn = get_db()?;

    conn.execute(
        "UPDATE download SET pause = ?1 WHERE source = ?2 AND id = ?3",
        params![if pause == true { 1 } else { 0 }, source, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn set_error_download(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
    error: bool,
) -> Result<(), String> {
    let conn = get_db()?;

    conn.execute(
        "
        UPDATE download_item SET error = ?1 
        WHERE source = ?2 AND id = ?3 AND season_index = ?4 AND episode_index = ?5
    ",
        params![
            if error == true { 1 } else { 0 },
            source,
            id,
            season_index,
            episode_index
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn set_done_download(
    source: &str,
    id: &str,
    season_index: usize,
    episode_index: usize,
    done: bool,
) -> Result<(), String> {
    let conn = get_db()?;

    conn.execute(
        "UPDATE download_item SET done = ?1 WHERE source = ?2 AND id = ?3 AND season_index = ?4 AND episode_index = ?5",
        params![if done == true { 1 } else { 0 }, source, id, season_index, episode_index],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_current_download_status() -> Result<Option<CurrentDownloadStatus>, String> {
    if let Some(current_download_status) = CURRENT_DOWNLOAD_STATUS.get(&1) {
        return Ok(Some(current_download_status.clone()));
    } else {
        return Ok(None);
    }
}

#[tauri::command]
pub async fn get_local_download_manifest(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
    update_state: bool
) -> Result<Option<ServerResult>, String> {
    let configs_data = configs::get()?;
    let storage_dir = configs_data.storage_dir;

    let download_dir = storage_dir
        .join(&source)
        .join(&id)
        .join(&season_index.to_string())
        .join(&episode_index.to_string())
        .join("download");

    let manifest_path = download_dir.join("manifest.json");
    if !manifest_path.exists() {
        return Ok(None);
    }

    let manifest_file = fs::File::open(&manifest_path).map_err(|e| e.to_string())?;

    let manifest_data: ServerResult =
        match serde_json::from_reader(manifest_file).map_err(|e| e.to_string()) {
            Ok(data) => data,
            Err(_) => {
                return Ok(None);
            }
        };
    if update_state {
        let mut local_manifest = get_local_manifest(source.clone(), id.clone()).await?;
        local_manifest.current_watch_season_index = Some(season_index);
        local_manifest.current_watch_episode_index = Some(episode_index);
        save_local_manifest(source, id, local_manifest).await?;
    }

    return Ok(Some(manifest_data));
}
