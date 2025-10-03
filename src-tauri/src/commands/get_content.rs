use tokio;
use tracing::{error, warn};
use reqwest::header::HeaderMap;
use std::fs;
use chrono::Utc;

use chlaty_core::request_plugin::get_episode_list::DataResult;

use crate::anime;
use crate::commands::favorite::{get_recent_from_favorite, get_tag_from_favorite};
use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};
use crate::commands::request_plugin::get_episode_list::get_episode_list;
use crate::models::home::{Content, ContentData, HomeData};
use crate::models::search::SearchData;
use crate::models::view::{ManifestData, ViewData};
use crate::utils::{configs, download_file, convert_file_src};

const CACHE_DELAY:usize = 1 * 60 * 60 * 1000;

#[tauri::command]
pub async fn home(source: String) -> Result<HomeData, String> {
    let mut _home_data: HomeData = HomeData {
        relevant_content: vec![],
        content: vec![],
    };
    if source == "anime" {
        match anime::home::new().await {
            Ok(data) => _home_data = data,
            Err(e) => {
                error!("[HOME] Error: {}", e);
                return Err(e)?;
            }
        }
    } else {
        return Err("Unkown Source".to_string());
    }

    /* Load Recent Watch */
    let content_data = &mut _home_data.content;

    let mut recent_content_data: Vec<ContentData> = vec![];
    let recent_from_favorite = get_recent_from_favorite(15).await?;
    for item in recent_from_favorite {
        let local_manifest = get_local_manifest(item.source, item.id.to_string()).await?;
        match local_manifest.manifest_data {
            Some(data) => {
                let new_content = ContentData {
                    id: item.id.to_string().clone(),
                    title: data.title,
                    poster: data.poster,
                };
                recent_content_data.push(new_content);
            }
            None => {
                let new_content = ContentData {
                    id: item.id.to_string().clone(),
                    title: "?".to_string(),
                    poster: "".to_string(),
                };
                recent_content_data.push(new_content);
            }
        }
    }

    if recent_content_data.len() > 0 {
        content_data.insert(
            0,
            Content {
                label: "Continuous Watching".to_string(),
                data: recent_content_data,
            },
        );
    }
    /* --- */

    return Ok(_home_data);
}

#[tauri::command]
pub async fn search(source: String, page: usize, search: String) -> Result<SearchData, String> {
    if source == "anime" {
        match anime::search::new(page, &search).await {
            Ok(data) => return Ok(data),
            Err(e) => {
                error!("Error: {}", e);
                return Err(e);
            }
        }
    }
    return Err("Unkown Source".to_string());
}

#[tauri::command]
pub async fn view(source: String, id: String) -> Result<ViewData, String> {
    /* Generate Task */
    let task_get_view_manifest_data;

    if source == "anime" {
        task_get_view_manifest_data = anime::view::new(&id);
    } else {
        return Err("Unkown Source".to_string());
    }
    /* --- */

    let mut local_manifest = get_local_manifest(source.clone(), id.clone()).await?;
    let mut link_plugin_id: String = String::new();
    let mut link_id: String = String::new();

    if let Some(link_plugin) = &local_manifest.link_plugin {
        link_plugin_id = link_plugin.plugin_id.clone().unwrap_or("".to_string());
        link_id = link_plugin.id.clone().unwrap_or("".to_string());
    }

    let storage_dir = configs::get()?.storage_dir;

    let item_dir = storage_dir.join(&source).join(&id);
    if !item_dir.exists(){
        fs::create_dir_all(&item_dir).map_err(|e| e.to_string())?;
    }
    let poster_path = item_dir.join("poster.png");
    let banner_path = item_dir.join("banner.png");

    let mut view_data: ViewData;

    if !link_plugin_id.is_empty() && !link_id.is_empty() {
        let (task_get_view_manifest_data, task_get_episode_list) = tokio::join!(
            task_get_view_manifest_data,
            get_episode_list(source.clone(), id.clone(), link_plugin_id.clone(), link_id)
        );
        let mut manifest_data: ManifestData = match task_get_view_manifest_data {
            Ok(data) => data,
            Err(e) => {
                warn!("[View] Failed to load remote manifest: {}\n=> Loading local manifest.", e);
                local_manifest.manifest_data.ok_or("[View] Error: Local manifest data not exists.".to_string())?
            }
        };


        let episode_list: Vec<Vec<Vec<DataResult>>>;
        match task_get_episode_list {
            Ok(data) => episode_list = data,
            Err(e) => {
                warn!("[View] Failed to load remote episode list: {}\n=> Loading local episode list.", e);
                episode_list = manifest_data.episode_list.unwrap_or(vec![]);
            }
        };

        manifest_data.episode_list = Some(episode_list);
        manifest_data
            .meta_data
            .insert(0, format!("Plugin: {}", link_plugin_id));

        view_data = ViewData {
            manifest_data: Some(manifest_data),
            link_plugin: local_manifest.link_plugin.clone(),
            current_watch_episode_index: None,
            current_watch_season_index: None,
            favorites: vec![],
        };
    } else {
        match task_get_view_manifest_data.await {
            Ok(data) => {
                view_data = ViewData {
                    manifest_data: Some(data),
                    link_plugin: None,
                    current_watch_episode_index: None,
                    current_watch_season_index: None,
                    favorites: vec![],
                };
            }
            Err(e) => {
                warn!("[View] Failed to load remote manifest: {}\n=> Loading local manifest.", e);
                view_data = ViewData {
                    manifest_data: Some(local_manifest.manifest_data.ok_or("[View] Error: Local manifest data not exists.".to_string())?),
                    link_plugin: None,
                    current_watch_episode_index: None,
                    current_watch_season_index: None,
                    favorites: vec![],
                };
            }
        }
    }

    view_data.current_watch_season_index = local_manifest.current_watch_season_index;
    view_data.current_watch_episode_index = local_manifest.current_watch_episode_index;

    let favoriate_tags = get_tag_from_favorite(source.clone(), id.clone()).await?;
    view_data.favorites = favoriate_tags.clone();

    if favoriate_tags.len() > 0 {
        local_manifest.manifest_data = view_data.manifest_data.clone();
        
        if let Some(manifest_data) = &mut view_data.manifest_data {
            /* Insert Plugin Info */
            manifest_data
                .meta_data
                .insert(0, format!("Favorite: {}", favoriate_tags.join(", ")));
             /* --- */

            /* Load and save local poster and banner if exist */
            let poster_url = &manifest_data.poster;
            let banner_url = &manifest_data.banner;

            let headers = HeaderMap::new();

            let mut should_cache = false;

            let current_timestamp: usize = Utc::now().timestamp_millis() as usize;

            if !poster_path.exists() || !banner_path.exists(){
                should_cache = true;
            }else{
                let local_timestamp: usize = local_manifest.last_save_timestamp.unwrap_or(0);
                if (current_timestamp - local_timestamp) >= CACHE_DELAY {
                    should_cache = true;
                }
            }

            if should_cache {
                match download_file::new(poster_url, &poster_path, headers.clone(),|_,_|{}).await{
                    Ok(_) => {},
                    Err(e) => {
                        warn!("[View] Failed to save remote poster: {}\n=> Loading local poster.", e);
                    }
                }

                match download_file::new(banner_url, &banner_path, headers.clone(),|_,_|{}).await{
                    Ok(_) => {},
                    Err(e) => {
                        warn!("[View] Failed to save remote banner: {}\n=> Loading local banner.", e);
                    }
                }
                local_manifest.last_save_timestamp = Some(current_timestamp);
            }

            if poster_path.exists() {
                manifest_data.poster = convert_file_src::new(&poster_path)?;
            }

            if banner_path.exists() {
                manifest_data.banner = convert_file_src::new(&banner_path)?;
            }
            /* --- */
        }

        save_local_manifest(source.clone(), id.clone(), local_manifest).await?;
    }



    return Ok(view_data);
}
