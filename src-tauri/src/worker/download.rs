use dashmap::DashMap;
use lazy_static::lazy_static;
use m3u8_rs::Playlist;
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::Client;
use rusqlite::{params, Error::QueryReturnedNoRows, Result};
use serde::{Deserialize, Serialize};
use serde_json::{from_reader, to_string, to_string_pretty};
use std::fs;
use std::path::PathBuf;
use std::str::from_utf8;
use tauri::AppHandle;
use tauri::Emitter;
use tokio::time::{sleep, Duration};
use tracing::{error, info, warn};

use chlaty_core::request_plugin::{get_episode_server, get_server, get_server::ServerResult};

use crate::utils::configs::Configs;

use crate::commands::download::{get_db, set_done_download, set_error_download};
use crate::models::download::{Download, DownloadItem, DownloadStatusManifest};
use crate::utils::download_file;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentDownloadStatus {
    pub source: String,
    pub id: String,
    pub season_index: usize,
    pub episode_index: usize,
    pub current: usize,
    pub total: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaHLS {
    pub data: String,
    pub server: ServerResult,
}


lazy_static! {
    pub static ref CURRENT_DOWNLOAD_STATUS: DashMap<usize, CurrentDownloadStatus> = DashMap::new(); // Tread Index, CurrentDownloadStatus
}

fn check_current_download(
    source: &str,
    id: &str,
    season_index: usize,
    episode_index: usize,
) -> Result<bool, String> {
    /* Check download data from download table if it exists. */

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
        WHERE source = ?1 AND id = ?2 AND pause = 0
        LIMIT 1
    ",
        )
        .map_err(|e| e.to_string())?;

    let result = stmt.query_row(params![source, id], |row| {
        Ok(Download {
            source: row.get(0)?,
            id: row.get(1)?,
            plugin_id: row.get(2)?,
            pause: row.get(3)?,
        })
    });
    match result {
        Ok(_) => {}
        Err(QueryReturnedNoRows) => return Ok(false),
        Err(e) => return Err(e.to_string())?,
    };

    let mut stmt = conn.prepare("
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
        WHERE source = ?1 AND id = ?2 AND season_index = ?3 AND episode_index = ?4 AND error = 0 AND done = 0
        LIMIT 1
    ").map_err(|e| e.to_string())?;

    let result = stmt.query_row(params![source, id, season_index, episode_index], |row| {
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
    });
    match result {
        Ok(_) => return Ok(true),
        Err(QueryReturnedNoRows) => return Ok(false),
        Err(e) => return Err(e.to_string())?,
    };

    /* --- */
}

fn get_current_download(offset:usize) -> Result<Option<Download>, String> {
    /* Get download data from download table */

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
        WHERE pause = 0
        LIMIT 1 OFFSET ?1
    ",
        )
        .map_err(|e| e.to_string())?;

    let result = stmt.query_row(params![offset], |row| {
        Ok(Download {
            source: row.get(0)?,
            id: row.get(1)?,
            plugin_id: row.get(2)?,
            pause: row.get(3)?,
        })
    });
    return match result {
        Ok(data) => Ok(Some(data)),
        Err(QueryReturnedNoRows) => Ok(None),
        Err(e) => return Err(e.to_string())?,
    };

    /* --- */
}

fn get_current_download_item(source: &str, id: &str) -> Result<Option<DownloadItem>, String> {
    /* Get download item data from download_item table */

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
        WHERE source = ?1 AND id = ?2 AND error = 0 AND done = 0
        LIMIT 1
    ",
        )
        .map_err(|e| e.to_string())?;

    let result = stmt.query_row(params![&source, &id], |row| {
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
    });
    return match result {
        Ok(data) => Ok(Some(data)),
        Err(QueryReturnedNoRows) => Ok(None),
        Err(e) => return Err(e.to_string())?,
    };

    /* --- */
}


async fn get_media_hls(
    source: &str,
    plugin_id: &str,
    server_id: &str,
    prefer_quality: usize,
) -> Result<MediaHLS, String> {
    let server_data = get_server::new(source, plugin_id, server_id).map_err(|e| e.to_string())?;

    let mut hls_file: String = "".to_string();

    for source in server_data.data.sources.clone() {
        if source._type == "hls" {
            hls_file = source.file;
        }
    }
    if hls_file.is_empty() {
        return Err("HLS file not found".to_string());
    }

    let config = server_data.config.clone();

    let client = Client::new();

    let mut headers = HeaderMap::new();
    headers.insert(
        "Host",
        HeaderValue::from_str(&config.host).map_err(|e| e.to_string())?,
    );
    headers.insert(
        "Referer",
        HeaderValue::from_str(&config.referer).map_err(|e| e.to_string())?,
    );
    headers.insert(
        "Origin",
        HeaderValue::from_str(&config.origin).map_err(|e| e.to_string())?,
    );

    info!("[worker:download] Downloading HLS... | {}", hls_file);
    let response = client
        .get(&hls_file)
        .timeout(Duration::from_secs(10))
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    info!(
        "[worker:download] Download done with status: {}",
        response.status()
    );

    if response.status().is_success() {
        let hls_data = response.bytes().await.map_err(|e| e.to_string())?;
        match m3u8_rs::parse_playlist(&hls_data) {
            Result::Ok((_, Playlist::MasterPlaylist(pl))) => {
                if pl.variants.len() == 0 {
                    return Err("Master playlist is empty".to_string());
                }
                let mut selected_media_uri: String = "".to_string();

                let mut selected_quality: usize = 0;
                let mut qualities: Vec<usize> = vec![];

                for variant in pl.variants.clone() {
                    if let Some(resolution) = variant.resolution {
                        qualities.push((resolution.width + resolution.height) as usize);
                    }
                }
                qualities.sort(); // (low -> high)

                if prefer_quality == 0 {
                    selected_quality = qualities[0];
                } else if prefer_quality == 3 {
                    selected_quality = qualities[qualities.len() - 1];
                } else {
                    if (qualities.len() % 2) == 1 {
                        selected_quality =
                            qualities[(qualities.len() as f32 / 2.0).ceil() as usize - 1];
                    } else {
                        if prefer_quality == 1 {
                            selected_quality = qualities[(qualities.len() / 2) - 1];
                        } else if prefer_quality == 2 {
                            selected_quality = qualities[qualities.len() / 2];
                        }
                    }
                }

                for variant in pl.variants {
                    if let Some(resolution) = variant.resolution {
                        if (resolution.width + resolution.height) as usize == selected_quality {
                            selected_media_uri = variant.uri;
                            break;
                        }
                    }
                }

                let mut headers = HeaderMap::new();
                headers.insert(
                    "Host",
                    HeaderValue::from_str(&config.host).map_err(|e| e.to_string())?,
                );
                headers.insert(
                    "Referer",
                    HeaderValue::from_str(&config.referer).map_err(|e| e.to_string())?,
                );
                headers.insert(
                    "Origin",
                    HeaderValue::from_str(&config.origin).map_err(|e| e.to_string())?,
                );

                let mut _url: String = "".to_string();
                if config.playlist_base_url.is_empty() {
                    _url = selected_media_uri;
                } else {
                    _url = format!("{}/{}", &config.playlist_base_url, selected_media_uri);
                }

                let response = client
                    .get(_url)
                    .timeout(Duration::from_secs(10))
                    .headers(headers)
                    .send()
                    .await
                    .map_err(|e| format!("Request failed: {}", e))?;

                if response.status().is_success() {
                    return Ok(MediaHLS {
                        data: response.text().await.map_err(|e| e.to_string())?,
                        server: server_data,
                    });
                }
            }
            Result::Ok((_, Playlist::MediaPlaylist(_))) => {
                return Ok(MediaHLS {
                    data: from_utf8(&hls_data).map_err(|e| e.to_string())?.to_string(),
                    server: server_data,
                });
            }
            Result::Err(e) => {
                return Err(e.to_string())?;
            }
        }
    }

    return Err("[get_media_hls] Request failed.".to_string());
}

async fn download_episode(
    app: AppHandle,
    source: &str,
    id: &str,
    season_index: usize,
    episode_index: usize,
    mut media_hls: MediaHLS,
) -> Result<(), String> {
    let app_configs_data = Configs::get().map_err(|e| e.to_string())?;
    let storage_dir = app_configs_data.storage_dir;

    let config = media_hls.server.config.clone();

    match m3u8_rs::parse_playlist(&media_hls.data.as_bytes()) {
        Result::Ok((_, Playlist::MediaPlaylist(mut pl))) => {
            let item_dir = storage_dir
                .join(source)
                .join(id)
                .join(&season_index.to_string())
                .join(&episode_index.to_string());
            let download_dir = item_dir.join("download");

            let segments_dir = download_dir.join("segments");
            let captions_dir = download_dir.join("captions");

            if !segments_dir.exists() {
                fs::create_dir_all(&segments_dir).map_err(|e| e.to_string())?;
            }

            let manifest_path = download_dir.join("manifest.json");
            let download_status_manifest_path = download_dir.join("download_status.json");

            /* Get current download status manifest */
            if !download_status_manifest_path.exists() {
                fs::write(&download_status_manifest_path, "{}").map_err(|e| e.to_string())?;
            }

            let last_download_status_manifest_file =
                fs::File::open(&download_status_manifest_path).map_err(|e| e.to_string())?;
            let last_download_status_mannifest_data: DownloadStatusManifest =
                match from_reader(last_download_status_manifest_file) {
                    Ok(data) => data,
                    Err(_) => DownloadStatusManifest::default(),
                };
            let last_download_index = last_download_status_mannifest_data.current;

            /* --- */

            /* Modify Headers */
            let mut headers = HeaderMap::new();
            if !config.host.is_empty() {
                headers.insert(
                    "Host",
                    HeaderValue::from_str(&config.host).map_err(|e| e.to_string())?,
                );
            };

            if !config.referer.is_empty() {
                headers.insert(
                    "Referer",
                    HeaderValue::from_str(&config.referer).map_err(|e| e.to_string())?,
                );
            };

            if !config.origin.is_empty() {
                headers.insert(
                    "Origin",
                    HeaderValue::from_str(&config.origin).map_err(|e| e.to_string())?,
                );
            };

            /* --- */

            /* Download Segments */
            if let Some(mut current_status) = CURRENT_DOWNLOAD_STATUS.get_mut(&0) {
                current_status.total = pl.segments.len() - 1;
            }

            for (index, segment) in pl.segments.clone().iter().enumerate() {
                if !check_current_download(source, id, season_index, episode_index)? {
                    return Ok(());
                }
                if (index as isize) <= last_download_index {
                    continue;
                }
                /* Set current download status. This is required to prevent unkown behavior on frontend. */
                if let Some(mut current_status) = CURRENT_DOWNLOAD_STATUS.get_mut(&0) {
                    let current = if index > 0 { index - 1 } else { 0 };
                    current_status.current = current;
                }
                match app.emit(
                    &format!(
                        "download-status-{}-{}-{}-{}",
                        source, id, season_index, episode_index
                    ),
                    CurrentDownloadStatus {
                        source: source.to_string(),
                        id: id.to_string(),
                        season_index,
                        episode_index,
                        current: if index > 0 { index - 1 } else { 0 },
                        total: pl.segments.len() - 1,
                    },
                ) {
                    Ok(_) => {}
                    Err(e) => {
                        error!("[Worker:Download] emit error: {}", e);
                    }
                }
                /* --- */

                let mut _url: String = "".to_string();

                if !config.segment_base_url.is_empty() {
                    _url = format!("{}/{}", &config.segment_base_url, segment.uri);
                } else {
                    _url = segment.uri.clone();
                }

                let segment_path = segments_dir.join(format!("segment-{}", index));

                download_file::new(&_url, &segment_path, headers.clone(), 300, |_, _| {})
                    .await
                    .map_err(|e| e.to_string())?;

                /* Save download status */
                if !download_status_manifest_path.exists() {
                    fs::write(&download_status_manifest_path, "{}").map_err(|e| e.to_string())?;
                }

                let download_status_manifest_file =
                    fs::File::open(&download_status_manifest_path).map_err(|e| e.to_string())?;
                let mut download_status_mannifest_data: DownloadStatusManifest =
                    match from_reader(download_status_manifest_file) {
                        Ok(data) => data,
                        Err(_) => DownloadStatusManifest::default(),
                    };

                download_status_mannifest_data.current = index as isize;
                let download_status_manifest_data_json =
                    to_string(&download_status_mannifest_data).map_err(|e| e.to_string())?;
                fs::write(
                    &download_status_manifest_path,
                    &download_status_manifest_data_json,
                )
                .map_err(|e| e.to_string())?;
                /* --- */

                /* Update current download status after downloaded segment */

                if let Some(mut current_status) = CURRENT_DOWNLOAD_STATUS.get_mut(&0) {
                    let current = index;
                    current_status.current = current;
                }
                match app.emit(
                    &format!(
                        "download-status-{}-{}-{}-{}",
                        source, id, season_index, episode_index
                    ),
                    CurrentDownloadStatus {
                        source: source.to_string(),
                        id: id.to_string(),
                        season_index,
                        episode_index,
                        current: index,
                        total: pl.segments.len() - 1,
                    },
                ) {
                    Ok(_) => {}
                    Err(e) => {
                        error!("[Worker:Download] emit error: {}", e);
                    }
                }
                /* --- */
            }

            /* --- */

            /* Map Segments URI to local and save to player.m3u8. */
            for (index, segment) in pl.segments.iter_mut().enumerate() {
                let new_segment_file = PathBuf::from(source)
                    .join(id)
                    .join(&season_index.to_string())
                    .join(&episode_index.to_string())
                    .join("download")
                    .join("segments")
                    .join(&format!("segment-{}", index))
                    .display()
                    .to_string();
                segment.uri = new_segment_file;
            }

            let player_path = download_dir.join("player.m3u8");
            if !player_path.exists() {
                fs::File::create(&player_path).map_err(|e| e.to_string())?;
            }
            let mut player_file = fs::OpenOptions::new()
                .read(true)
                .write(true)
                .open(&player_path)
                .map_err(|e| e.to_string())?;

            pl.write_to(&mut player_file).map_err(|e| e.to_string())?;

            /* --- */

            /* Download Captions */
            if !captions_dir.exists() {
                fs::create_dir_all(&captions_dir).map_err(|e| e.to_string())?;
            }
            let server = &mut media_hls.server;

            let captions = &mut server.data.tracks;

            for (index, caption) in captions.iter_mut().enumerate() {
                let caption_file_name = format!(
                    "{}.vtt",
                    if let Some(label) = &caption.label {
                        label.clone()
                    } else {
                        index.to_string()
                    }
                );
                let caption_path = captions_dir.join(&caption_file_name);
                match download_file::new(&caption.file, &caption_path, headers.clone(), 300, |_, _| {}).await {
                    Ok(_) => {
                        let new_caption_file = PathBuf::from(source)
                            .join(id)
                            .join(&season_index.to_string())
                            .join(&episode_index.to_string())
                            .join("download")
                            .join("captions")
                            .join(&caption_file_name)
                            .display()
                            .to_string();
                        caption.file = new_caption_file;
                    }
                    Err(e) => {
                        warn!("[Worker:Download] download captions: {}\n-> Skipping...", e);
                    }
                }
            }
            /* --- */

            /* Modify Sources before save manifest */
            let sources = &mut server.data.sources;

            let new_source_file = PathBuf::from(source)
                .join(id)
                .join(&season_index.to_string())
                .join(&episode_index.to_string())
                .join("download")
                .join("player.m3u8")
                .display()
                .to_string();

            for source in sources.iter_mut() {
                if source._type == "hls" {
                    source.file = new_source_file;
                    break;
                }
            }
            /* --- */

            /* Reset Config */
            let config = &mut server.config;
            config.host = "".to_string();
            config.origin = "".to_string();
            config.referer = "".to_string();
            config.playlist_base_url = "".to_string();
            config.segment_base_url = "".to_string();
            /* --- */

            fs::write(
                &manifest_path,
                to_string_pretty(&server).map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())?;

            set_done_download(source, id, season_index, episode_index, true)
                .await
                .map_err(|e| e.to_string())?;

            if download_status_manifest_path.exists() {
                fs::remove_file(&download_status_manifest_path).map_err(|e| e.to_string())?;
            }

            match app.emit(
                &format!(
                    "download-finish-{}-{}-{}-{}",
                    source, id, season_index, episode_index
                ),
                true,
            ) {
                Ok(_) => {}
                Err(e) => {
                    error!("[Worker:Download] emit error: {}", e);
                }
            }
            /* --- */
        }
        Result::Err(e) => return Err(e.to_string())?,
        _ => return Err("[download_episode] Request failed.".to_string()),
    }

    return Ok(());
}

async fn set_current_download_error(
    app: AppHandle,
    source: &str,
    id: &str,
    season_index: usize,
    episode_index: usize,
) -> Result<(), String> {
    set_error_download(
        source.to_string(),
        id.to_string(),
        season_index,
        episode_index,
        true,
    )
    .await?;
    match app.emit(
        &format!(
            "download-error-{}-{}-{}-{}",
            source, id, season_index, episode_index
        ),
        true,
    ) {
        Ok(_) => {}
        Err(e) => {
            error!("[Worker:Download] emit error: {}", e);
        }
    }

    return Ok(());
}


pub fn is_available_download() -> Result<bool, String> {
    let conn = get_db()?;

    let count_download: usize = conn.query_row(
        "SELECT COUNT(*) FROM download WHERE pause = 0",
        params![],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())?;

    if count_download == 0 {
        return Ok(false);
    }

    let count_download_item:usize = conn.query_row(
        "SELECT COUNT(*) FROM download_item WHERE error = 0 AND done = 0",
        params![],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())?;

    if count_download_item == 0 {
        return Ok(false);
    }

    return Ok(true);
}

async fn start_task(app: AppHandle) -> Result<(), String> {
    let mut offset:usize = 0;

    loop {
        let current_download_result = get_current_download(offset)?;
        if let Some(current_download) = current_download_result {
            let source = current_download.source;
            let id = current_download.id;
            let plugin_id = current_download.plugin_id;
            
            let current_download_item_result = get_current_download_item(&source, &id)?;
            if let Some(current_download_item) = current_download_item_result {
                let season_index = current_download_item.season_index;
                let episode_index = current_download_item.episode_index;
                let episode_id = current_download_item.episode_id;

                let prefer_server_type = current_download_item.prefer_server_type;
                let prefer_server_index = current_download_item.prefer_server_index;
                let prefer_quality = current_download_item.prefer_quality;

                info!("[worker:download] currently working on: \n-> source: {}, id: {}, season_index: {}, episode_index: {}",
                    &source, &id, season_index, episode_index
                );

                CURRENT_DOWNLOAD_STATUS.insert(
                    0,
                    CurrentDownloadStatus {
                        source: source.clone(),
                        id: id.clone(),
                        season_index: season_index,
                        episode_index: episode_index,
                        current: 0,
                        total: 0,
                    },
                );

                let ep_server_data = get_episode_server::new(
                    &source,
                    &plugin_id,
                    season_index,
                    episode_index,
                    &episode_id,
                )
                .map_err(|e| e.to_string())?;

                let mut selected_server_id: String = "".to_string();

                match ep_server_data.get(&prefer_server_type) {
                    Some(server) => {
                        if server.len() == 0 {
                            set_current_download_error(app, &source, &id, season_index, episode_index)
                                .await?;
                            return Err("No server available".to_string());
                        }
                        for server in server {
                            if server.index == prefer_server_index {
                                selected_server_id = server.id.clone();
                                break;
                            }
                        }

                        if selected_server_id == "".to_string() {
                            set_current_download_error(app, &source, &id, season_index, episode_index)
                                .await?;
                            return Err("Unable to find prefer server".to_string());
                        }
                    }
                    None => {
                        set_current_download_error(app, &source, &id, season_index, episode_index)
                            .await?;
                        return Err("Unable to find prefer server type".to_string());
                    }
                }

                let media_hls =
                    match get_media_hls(&source, &plugin_id, &selected_server_id, prefer_quality).await
                    {
                        Ok(media_hls) => media_hls,
                        Err(e) => {
                            set_current_download_error(app, &source, &id, season_index, episode_index)
                                .await?;
                            return Err(e.to_string());
                        }
                    };

                match download_episode(
                    app.clone(),
                    &source,
                    &id,
                    season_index,
                    episode_index,
                    media_hls,
                )
                .await
                {
                    Ok(_) => {}
                    Err(e) => {
                        set_current_download_error(app, &source, &id, season_index, episode_index)
                            .await?;
                        return Err(e.to_string());
                    }
                }

                break;
            }
            
        }else{
            break;
        }

        offset += 1;
    }
    return Ok(());
}

pub async fn new(app: AppHandle) {
    loop {
        match is_available_download() {
            Ok(available) => {
                if available {
                    match start_task(app.clone()).await {
                        Ok(_) => {}
                        Err(e) => error!("[Worker:Download]: {}", e),
                    }
                    continue;
                }
            }
            Err(e) => error!("[Worker:Download] count available error: {}", e),
        }
        sleep(Duration::from_secs(5)).await;
    }
}
