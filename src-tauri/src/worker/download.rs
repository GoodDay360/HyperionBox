use dashmap::DashMap;
use lazy_static::lazy_static;
use m3u8_rs::{Playlist, MediaSegment};
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT, ACCEPT, ACCEPT_ENCODING, HOST, REFERER, ORIGIN};
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
use tauri::async_runtime;
use std::sync::Arc;
use async_runtime::JoinHandle;
use futures::future::join_all;
use url::Url;

use chlaty_core::request_plugin::{get_episode_server, get_server, get_server::ServerResult};


use crate::utils::configs::Configs;

use crate::commands::download::{get_db, set_done_download, set_error_download, is_available_download};
use crate::models::download::{Download, DownloadItem, DownloadStatusManifest};
use crate::utils::download_file;
use crate::utils::url::normalize_base_url;

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

    pub static ref SEND_DOWNLOAD_STATUS_HANDLE: DashMap<usize, JoinHandle<()>> = DashMap::new();
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
    server_index: usize,
    server_id: &str,
    prefer_quality: usize,
) -> Result<MediaHLS, String> {
    let server_data = get_server::new(source, plugin_id, server_index, server_id).map_err(|e| e.to_string())?;

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

    

    let mut headers = HeaderMap::new();

    if !config.host.is_empty() {
        let parsed_url = Url::parse(&hls_file).map_err(|e| e.to_string())?;
        let parsed_url_host = parsed_url.host_str().ok_or("no host")?.to_string();
        let new_host = if config.host == parsed_url_host { &config.host } else { &parsed_url_host };

        headers.insert(
            HOST,
            HeaderValue::from_str(&new_host).map_err(|e| e.to_string())?,
        );
    }
    
    if !config.referer.is_empty() {
        headers.insert(
            REFERER,
            HeaderValue::from_str(&config.referer).map_err(|e| e.to_string())?,
        );
    }
    
    if !config.origin.is_empty() {
        headers.insert(
            ORIGIN,
            HeaderValue::from_str(&config.origin).map_err(|e| e.to_string())?,
        );
    }
    headers.insert(USER_AGENT, HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"));
    headers.insert(ACCEPT, HeaderValue::from_static("*/*"));
    headers.insert(ACCEPT_ENCODING, HeaderValue::from_static("gzip, deflate, br"));

    let client = Client::builder()
        .cookie_store(true)
        .pool_idle_timeout(None)
        .pool_max_idle_per_host(5)
        .default_headers(headers.clone())
        .build()
        .map_err(|e| e.to_string())?;

    info!("[worker:download] Downloading HLS... | {}", hls_file);
    let response = client
        .get(&hls_file)
        .timeout(Duration::from_secs(10))
        .headers(headers.clone())
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    info!(
        "[worker:download] Download done with status: {}",
        response.status()
    );

    if !response.status().is_success() {
        return Err(format!("[get_media_hls] Request failed. {}", response.status()))?;
    }

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
            
            let mut _url: String = "".to_string();
            if config.playlist_base_url.is_empty() {
                _url = selected_media_uri;
            } else {
                _url = normalize_base_url(&format!("{}/{}", &config.playlist_base_url, selected_media_uri));
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

        

    return Err("[get_media_hls] Request failed.".to_string())?;
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
    let storage_dir = app_configs_data.storage_dir.ok_or("Storage directory not set".to_string())?;

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
            


            /* Modify Headers */
            let mut headers = HeaderMap::new();
            
            if !config.host.is_empty() {
                headers.insert(
                    HOST,
                    HeaderValue::from_str(&config.host).map_err(|e| e.to_string())?,
                );
            };

            if !config.referer.is_empty() {
                headers.insert(
                    REFERER,
                    HeaderValue::from_str(&config.referer).map_err(|e| e.to_string())?,
                );
            };

            if !config.origin.is_empty() {
                headers.insert(
                    ORIGIN,
                    HeaderValue::from_str(&config.origin).map_err(|e| e.to_string())?,
                );
            };

            headers.insert(USER_AGENT, HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"));
            headers.insert(ACCEPT, HeaderValue::from_static("*/*"));
            headers.insert(ACCEPT_ENCODING, HeaderValue::from_static("gzip, deflate, br"));

            /* --- */

            /* Setup Download Segments */
            let max_segment = pl.segments.len();
            if let Some(mut current_status) = CURRENT_DOWNLOAD_STATUS.get_mut(&0) {
                current_status.total = max_segment - 1;
            }
            
            let mut distribute_work: Vec<Vec<MediaSegment>> = vec![];

            let max_download_worker: f64 = app_configs_data.download_worker_threads.ok_or("[download_episode]: download worker threads key not found")? as f64;
            
            let max_work_per_worker: usize = (max_segment as f64 / max_download_worker).ceil() as usize;

            let mut new_work: Vec<MediaSegment> = vec![];
            let mut current_work: usize = 0;
            for segment in pl.segments.iter() {
                
                if current_work == max_work_per_worker{
                    new_work.push(segment.clone());
                    distribute_work.push(new_work.clone());

                    current_work = 0;
                    new_work = vec![];
                }else{
                    current_work += 1;
                    new_work.push(segment.clone());
                }
            }
            // Push remaining work
            if new_work.len() > 0 {
                distribute_work.push(new_work);
            }
            // ---

            let worker_download_status:Arc<DashMap<usize, usize>> = Arc::new(DashMap::new());  // worker index, downloaded segments per worker.
            let mut worker_handles:Vec<JoinHandle<Result<(), String>>> = vec![];


            /* Setup send status to frontend. */
            
            let source_clone = Arc::new(source.to_string());
            let id_clone = Arc::new(id.to_string());
            let app_clone = app.clone();
            let worker_download_status_clone = Arc::clone(&worker_download_status);

            if let Some((_, handle)) = SEND_DOWNLOAD_STATUS_HANDLE.remove(&0) {
                let _ = handle.await;
            }
            
            
            let handle = async_runtime::spawn(async move {
                loop {
                    if let Some(current_status) = CURRENT_DOWNLOAD_STATUS.get(&0) {
                        let check_source = &current_status.source;
                        let check_id = &current_status.id;
                        let check_season_index = current_status.season_index;
                        let check_episode_index = current_status.episode_index;

                        if *source_clone != *check_source
                            || *id_clone != *check_id
                            || season_index != check_season_index
                            || episode_index != check_episode_index
                        {
                            return;
                        }
                    }else{
                        return;
                    }

                    let mut total_segment_download: usize = 0;
                    for count in worker_download_status_clone.iter() {
                        total_segment_download += count.value();
                    }

                    /* Set current download status. This is required to show frontend what it doing. */
                    if let Some(mut current_status) = CURRENT_DOWNLOAD_STATUS.get_mut(&0) {
                        let current = total_segment_download;
                        current_status.current = current;
                    }
                    /* --- */

                    /* emit status to frontend. */
                    match app_clone.emit(
                        &format!(
                            "download-status-{}-{}-{}-{}",
                            &source_clone, &id_clone, season_index, episode_index
                        ),
                        CurrentDownloadStatus {
                            source: (*source_clone).clone(),
                            id: (*id_clone).clone(),
                            season_index,
                            episode_index,
                            current: total_segment_download,
                            total: max_segment,
                        },
                    ) {
                        Ok(_) => {}
                        Err(e) => {
                            warn!("[Worker:Download] emit error: {}", e);
                        }
                    }
                    /* --- */

                    if total_segment_download == max_segment {
                        break;
                    }

                    sleep(Duration::from_secs(2)).await;
                }
            });

            SEND_DOWNLOAD_STATUS_HANDLE.insert(0, handle);
            
            /* --- */

            

            let mut segment_start_index: usize = 0;
            
            for (worker_index, work) in distribute_work.into_iter().enumerate() {
                let current_work_len = work.len();
                
                /* Get current download status manifest */
                let download_status_manifest_path = download_dir.join(format!("download-status-worker-{}.json", worker_index));

                if !download_status_manifest_path.exists() {
                    fs::write(&download_status_manifest_path, "{}").map_err(|e| e.to_string())?;
                }

                let last_download_status_manifest_file =
                    fs::File::open(&download_status_manifest_path).map_err(|e| e.to_string())?;
                let last_download_status_mannifest_data: DownloadStatusManifest = match from_reader(last_download_status_manifest_file) {
                    Ok(data) => data,
                    Err(_) => DownloadStatusManifest::default(),
                };
                let last_download_index = last_download_status_mannifest_data.current;

                /* --- */

                /* Spawn Worker */
                let source_clone = source.to_string();
                let id_clone = id.to_string();
                let worker_download_status_clone = Arc::clone(&worker_download_status);
                let config_clone = config.clone();
                let segment_dir_clone = segments_dir.clone();
                let download_status_manifest_path_clone = download_status_manifest_path.clone();
                let header_clone = headers.clone();
                let handle:JoinHandle<Result<(), String>> = async_runtime::spawn(async move {
                    let start_index = segment_start_index;
                    for (index, segment) in work.iter().enumerate() {
                        if !check_current_download(&source_clone, &id_clone, season_index, episode_index)? {
                            return Ok(());
                        }
                        
                        // println!("START INDEX: {}, LAST INDEX: {}", start_index+index, last_download_index);

                        if ((start_index + index) as isize) <= last_download_index {
                            /* Update current worker download status after continue from last download */
                            (*worker_download_status_clone).insert(worker_index, index+1);
                            /* --- */
                            continue;
                        }

                        let mut _url: String = "".to_string();

                        if !config_clone.segment_base_url.is_empty() {
                            _url = normalize_base_url(&format!("{}/{}", &config_clone.segment_base_url, segment.uri));
                        } else {
                            _url = segment.uri.clone();
                        }

                        let segment_path = segment_dir_clone.join(format!("segment-{}", start_index+index));


                        download_file::new(&_url, &segment_path, Some(header_clone.clone()), 30, |_, _| {})
                            .await
                            .map_err(|e| e.to_string())?;

                        /* Save download status */
                        if !download_status_manifest_path_clone.exists() {
                            fs::write(&download_status_manifest_path_clone, "{}").map_err(|e| e.to_string())?;
                        }

                        let download_status_manifest_file =
                            fs::File::open(&download_status_manifest_path_clone).map_err(|e| e.to_string())?;
                        let mut download_status_mannifest_data: DownloadStatusManifest =
                            match from_reader(download_status_manifest_file) {
                                Ok(data) => data,
                                Err(_) => DownloadStatusManifest::default(),
                            };

                        download_status_mannifest_data.current = (start_index+index) as isize;
                        let download_status_manifest_data_json =
                            to_string(&download_status_mannifest_data).map_err(|e| e.to_string())?;
                        fs::write(
                            &download_status_manifest_path_clone,
                            &download_status_manifest_data_json,
                        )
                        .map_err(|e| e.to_string())?;
                        /* --- */

                        /* Update current worker download status after downloaded segment */
                        (*worker_download_status_clone).insert(worker_index, index+1);
                        /* --- */
                    }
                    Ok(())
                });
                worker_handles.push(handle);
                segment_start_index += current_work_len;
                /* --- */
            }
            /* --- */

            /* Wait for all workers to finish. */

            let results = join_all(worker_handles).await;

            for (index, result) in results.iter().enumerate() {
                match result {
                    Ok(_) => {},
                    Err(e) => {
                        error!("[worker-{}] Task failed: {}", index, e);
                        return Err(e.to_string());
                    },
                }
            }

            /* --- */

            /* Clean up download status */
            let mut total_segment_download: usize = 0;
            for count in worker_download_status.iter() {
                total_segment_download += count.value();
            }
            // println!("total_s: {}| max_s: {}", total_segment_download, max_segment);
            if total_segment_download == max_segment {
                for i in 0..(max_download_worker as usize) {
                    let download_status_manifest_path = download_dir.join(format!("download-status-worker-{}.json", i));

                    if download_status_manifest_path.exists() {
                        fs::remove_file(&download_status_manifest_path).map_err(|e| e.to_string())?;
                    }
                };
            }else{
                return Ok(());
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
                match download_file::new(&caption.file, &caption_path, Some(headers.clone()), 40, |_, _| {}).await {
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

                // info!("[worker:download] currently working on: \n-> source: {}, id: {}, season_index: {}, episode_index: {}",
                //     &source, &id, season_index, episode_index
                // );

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

                let mut selected_server_index:usize = 0;
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
                                selected_server_index = server.index;
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

                let media_hls = match get_media_hls(&source, &plugin_id, selected_server_index, &selected_server_id, prefer_quality).await
                    {
                        Ok(media_hls) => media_hls,
                        Err(e) => {
                            set_current_download_error(app, &source, &id, season_index, episode_index)
                                .await?;
                            return Err(e.to_string());
                        }
                    };

                let mut retry:usize = 0;
                loop {
                    match download_episode(
                        app.clone(),
                        &source,
                        &id,
                        season_index,
                        episode_index,
                        media_hls.clone(),
                    ).await {
                        Ok(_) => {break}
                        Err(e) => {
                            if retry == 3 {
                                set_current_download_error(app, &source, &id, season_index, episode_index)
                                    .await?;
                                return Err(e.to_string());
                            }else{
                                retry+=1;
                                continue;
                            }
                            
                        }
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
        CURRENT_DOWNLOAD_STATUS.clear();
        if let Some((_, handle)) = SEND_DOWNLOAD_STATUS_HANDLE.remove(&0) {
            let _ = handle.await;
        }

        match is_available_download() {
            Ok(available) => {
                
                if available {
                    // println!("[Worker:Download] Available");
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
