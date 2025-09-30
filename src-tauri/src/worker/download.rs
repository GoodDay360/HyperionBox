use rusqlite::config;
use tokio::time::{sleep, Duration};
use rusqlite::{
    Result, params,
    Error::QueryReturnedNoRows
};
use tracing::error;
use tauri::async_runtime;
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue};
use m3u8_rs::Playlist;
use std::str::{from_utf8};
use bytes::Bytes;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use chlaty_core::request_plugin::{
    get_episode_server, get_server,
    get_server::Config,
};

use crate::commands::download::{
    get_db
};
use crate::models::download::{Download, DownloadItem};

pub async fn set_error_download(source: &str, id: &str, season_index: usize, episode_index: usize, error: bool) -> Result<(), String> {
    let conn = get_db()?;

    conn.execute("
        UPDATE download_item SET error = ?1 
        WHERE source = ?2 AND id = ?3 AND season_index = ?4 AND episode_index = ?5
    ", params![if error == true { 1 } else { 0 }, source, id, season_index, episode_index],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

fn get_current_download() -> Result<Option<Download>, String> {
     /* Get download data from download table */
    
    let conn = get_db()?;
    let mut stmt = conn.prepare("
        SELECT
            source,
            id,
            plugin_id,
            pause
        FROM download 
        WHERE pause = 0
        LIMIT 1
    ").map_err(|e| e.to_string())?;

    let result = stmt.query_row(params![], |row| {
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
        WHERE source = ?1 AND id = ?2 AND error = 0 AND done = 0
        LIMIT 1
    ").map_err(|e| e.to_string())?;

    let result = stmt.query_row(params![source, id], |row| {
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


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaHLS {
    pub data: String,
    pub config: Config
}

async fn get_media_hls(
    source: &str, 
    plugin_id: &str, 
    server_id: &str,
    prefer_quality: usize,
) -> Result<MediaHLS, String> {
    let server_data = get_server::new(
        source, plugin_id, server_id
    ).map_err(|e| e.to_string())?;

    println!("server_data: {:?}", server_data);

    let mut hls_file: String = "".to_string();

    for source in server_data.data.sources{
        if source._type == "hls" {
            hls_file = source.file;
        }
    }
    if hls_file.is_empty() {
        return Err("HLS file not found".to_string());
    }

    let config = server_data.config;

    let client = Client::new();

    let mut headers = HeaderMap::new();
    headers.insert("Host", HeaderValue::from_str(&config.host).map_err(|e| e.to_string())?);
    headers.insert("Referer", HeaderValue::from_str(&config.referer).map_err(|e| e.to_string())?);
    headers.insert("Origin", HeaderValue::from_str(&config.origin).map_err(|e| e.to_string())?);
    

    let response = client.get(&hls_file)
        .headers(headers)
        .send().await.map_err(|e| format!("Request failed: {}", e))?;


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
                }else if prefer_quality == 3 {
                    selected_quality = qualities[qualities.len() - 1];
                }else {
                    if (qualities.len() % 2) == 1 {
                        selected_quality = qualities[(qualities.len() as f32 / 2.0).ceil() as usize - 1];
                    }else{
                        if prefer_quality == 1 {
                            selected_quality = qualities[(qualities.len() / 2) - 1];
                        }else if prefer_quality == 2 {
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
                headers.insert("Host", HeaderValue::from_str(&config.host).map_err(|e| e.to_string())?);
                headers.insert("Referer", HeaderValue::from_str(&config.referer).map_err(|e| e.to_string())?);
                headers.insert("Origin", HeaderValue::from_str(&config.origin).map_err(|e| e.to_string())?);
                
                let mut _url: String = "".to_string();
                if config.playlist_base_url.is_empty() {
                    _url = selected_media_uri;
                }else {
                    _url = format!("{}/{}", &config.playlist_base_url, selected_media_uri);
                }

                let response = client.get(_url)
                    .headers(headers)
                    .send().await.map_err(|e| format!("Request failed: {}", e))?;


                if response.status().is_success() {
                    return Ok(MediaHLS {
                        data: response.text().await.map_err(|e| e.to_string())?,
                        config
                    });
                }

            },
            Result::Ok((_, Playlist::MediaPlaylist(pl))) => {
                return Ok(MediaHLS {
                    data: from_utf8(&hls_data).map_err(|e| e.to_string())?.to_string(),
                    config
                });
                
            },
            Result::Err(e) => {
                return Err(e.to_string())?;
            },
        }
    }

    return Err("[get_media_hls] Request failed.".to_string());
}

async fn download_episode(
    source: &str,
    id: &str,
    season_index: usize,
    episode_index: usize,
    media_hls: MediaHLS
) -> Result<(), String> {
    
    match m3u8_rs::parse_playlist(&media_hls.data.as_bytes()) {
        Result::Ok((_, Playlist::MediaPlaylist(pl))) => {
            for segment in pl.segments {
                println!("segment: {}", segment.uri);
            }
        },
        Result::Err(e) =>  return Err(e.to_string())?,
        _ => return Err("[download_episode] Request failed.".to_string()),
    }

    return Ok(());
}


async fn start_task() -> Result<(), String> {
    let current_download_result = get_current_download()?;

    if let Some(current_download) = current_download_result {
        let current_download_item_result = get_current_download_item(&current_download.source, &current_download.id)?;

        if let Some(current_download_item) = current_download_item_result {
            println!("current_download_item: {:?}", current_download_item);
            let source = current_download.source;
            let id = current_download.id;
            let plugin_id = current_download.plugin_id;
            let season_index = current_download_item.season_index;
            let episode_index = current_download_item.episode_index;
            let episode_id = current_download_item.episode_id;
            
            let prefer_server_type = current_download_item.prefer_server_type;
            let prefer_server_index = current_download_item.prefer_server_index;
            let prefer_quality = current_download_item.prefer_quality;

            let ep_server_data = get_episode_server::new(
                &source,
                &plugin_id,
                season_index,
                episode_index,
                &episode_id
            ).map_err(|e| e.to_string())?;

            let mut selected_server_id: String = "".to_string();

            match ep_server_data.get(&prefer_server_type) {
                Some(server) => {
                    if server.len() == 0 {
                        set_error_download(&source, &id, season_index, episode_index, true).await?;
                        return Err("No server available".to_string());
                    }
                    for server in server {
                        if server.index == prefer_server_index {
                            selected_server_id = server.id.clone();
                            break;
                        }
                    }

                    if selected_server_id == "".to_string() {
                        set_error_download(&source, &id, season_index, episode_index, true).await?;
                        return Err("Unable to find prefer server".to_string());
                    }
                },
                None => {
                    set_error_download(&source, &id, season_index, episode_index, true).await?;
                    return Err("Unable to find prefer server type".to_string());
                }
            }

            println!("selected_server_id: {}", selected_server_id);

            let media_hls = get_media_hls(
                &source, 
                &plugin_id, 
                &selected_server_id,
                prefer_quality
            ).await?;

            download_episode(&source, &id, season_index, episode_index, media_hls).await?;
            

        }

    }

    return Ok(());
}

pub fn new() {
    async_runtime::spawn(async move {
        loop {
            
            sleep(Duration::from_secs(5)).await;

            match start_task().await {
                Ok(_) => {},
                Err(e) => error!("[Worker:Download]: {}", e)
            }
            
        }
    });
    return;
}