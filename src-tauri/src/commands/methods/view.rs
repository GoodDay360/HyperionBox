use chrono::Utc;
use reqwest::header::HeaderMap;
use std::fs;
use tokio;
use tracing::{warn};
use std::future::Future;
use std::pin::Pin;

use chlaty_core::request_plugin::get_episode_list::DataResult;

use crate::sources::anime;
use crate::sources::movie;
use crate::commands::favorite::{get_tag_from_favorite};
use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};
use crate::commands::request_plugin::get_episode_list::get_episode_list;
use crate::models::view::{ManifestData, ViewData};
use crate::utils::{configs::Configs, convert_file_src, download_file};

const CACHE_DELAY: usize = 3 * 60 * 60 * 1000; // In milliseconds

#[tauri::command]
pub async fn view(source: String, id: String, force_remote: bool) -> Result<ViewData, String> {
    /* Generate Task */
    let task_get_view_manifest_data: Pin<Box<dyn Future<Output = Result<ManifestData, String>> + Send>>;

    if source == "anime" {
        task_get_view_manifest_data = Box::pin(anime::view::new(&id));
    }else if source == "movie" {
        task_get_view_manifest_data = Box::pin(movie::view::new(&id));
    }else {
        return Err("Unkown Source".to_string());
    }
    /* --- */

    let mut local_manifest = get_local_manifest(source.clone(), id.clone()).await?;
    let local_timestamp: usize = local_manifest.last_save_timestamp.unwrap_or(0);

    let favoriate_tags = get_tag_from_favorite(source.clone(), id.clone()).await?;

    let mut link_plugin_id: String = String::new();
    let mut link_id: String = String::new();

    if let Some(link_plugin) = &local_manifest.link_plugin {
        link_plugin_id = link_plugin.plugin_id.clone().unwrap_or("".to_string());
        link_id = link_plugin.id.clone().unwrap_or("".to_string());
    }

    let storage_dir = Configs::get()?.storage_dir.ok_or("Storage directory not set".to_string())?;

    let item_dir = storage_dir.join(&source).join(&id);
    if !item_dir.exists() {
        fs::create_dir_all(&item_dir).map_err(|e| e.to_string())?;
    }
    let poster_path = item_dir.join("poster.png");
    let banner_path = item_dir.join("banner.png");

    let mut view_data: ViewData = ViewData {
        manifest_data: None,
        link_plugin: None,
        current_watch_season_index: None,
        current_watch_episode_index: None,
        favorites: favoriate_tags.clone(),
    };

    let mut should_fetch_remote: bool = true;
    /* Load from cache if it exist and not expired */
    if (favoriate_tags.len() > 0) && !force_remote {
        let current_timestamp: usize = Utc::now().timestamp_millis() as usize;
        if (current_timestamp - local_timestamp) < CACHE_DELAY {
            if let Some(manifest_data) = &local_manifest.manifest_data {
                if manifest_data.episode_list.is_some() || local_manifest.link_plugin.is_none() {
                    view_data = ViewData {
                        manifest_data: Some(manifest_data.clone()),
                        link_plugin: local_manifest.link_plugin.clone(),
                        current_watch_season_index: local_manifest.current_watch_season_index.clone(),
                        current_watch_episode_index: local_manifest.current_watch_episode_index.clone(),
                        favorites: favoriate_tags.clone(),
                    };
                    should_fetch_remote = false;
                }
            }
        }
    }
    /* --- */

    /* Fetch from remote if cache expire/not exist and not in favorite */
    /* This fallback to use local manifest if it failed to fetch. */

    if should_fetch_remote {

        if !link_plugin_id.is_empty() && !link_id.is_empty() {
            let (task_get_view_manifest_data, task_get_episode_list) = tokio::join!(
                task_get_view_manifest_data,
                get_episode_list(source.clone(), id.clone(), link_plugin_id.clone(), link_id)
            );
            let mut manifest_data: ManifestData = match task_get_view_manifest_data {
                Ok(data) => data,
                Err(e) => {
                    warn!(
                        "[View] Failed to load remote manifest: {}\n=> Loading local manifest.",
                        e
                    );
                    local_manifest
                        .manifest_data
                        .ok_or("[View] Error: Local manifest data not exists.".to_string())?
                }
            };

            let episode_list: Vec<Vec<Vec<DataResult>>>;
            match task_get_episode_list {
                Ok(data) => episode_list = data,
                Err(e) => {
                    warn!(
                        "[View] Failed to load remote episode list: {}\n=> Loading local episode list.",
                        e
                    );
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
                    warn!(
                        "[View] Failed to load remote manifest: {}\n=> Loading local manifest.",
                        e
                    );
                    view_data = ViewData {
                        manifest_data: Some(
                            local_manifest
                                .manifest_data
                                .ok_or("[View] Error: Local manifest data not exists.".to_string())?,
                        ),
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

        view_data.favorites = favoriate_tags.clone();
    }

    /* --- */
    
    /* Save remote manifest data to local if it in favorite */
    if favoriate_tags.len() > 0 {
        local_manifest.manifest_data = view_data.manifest_data.clone();
        if let Some(manifest_data) = &mut view_data.manifest_data {
            /* Insert Plugin Info */
            manifest_data
                .meta_data
                .insert(0, format!("Favorite: {}", favoriate_tags.join(", ")));
            /* --- */

            /* Load and cache local poster and banner if exist */
            let poster_url = &manifest_data.poster;
            let banner_url = &manifest_data.banner;

            

            let headers = HeaderMap::new();

            let mut should_cache_media = false;

            let current_timestamp: usize = Utc::now().timestamp_millis() as usize;

            if !poster_path.exists() || !banner_path.exists() {
                should_cache_media = true;
            } else {
                if (current_timestamp - local_timestamp) >= CACHE_DELAY {
                    should_cache_media = true;
                }
            }

            if should_cache_media {
                match download_file::new(poster_url, &poster_path, headers.clone(), 10, |_, _| {}).await
                {
                    Ok(_) => {}
                    Err(e) => {
                        warn!(
                            "[View] Failed to save remote poster: {}\n=> Loading local poster.",
                            e
                        );
                    }
                }

                match download_file::new(banner_url, &banner_path, headers.clone(), 10, |_, _| {}).await
                {
                    Ok(_) => {}
                    Err(e) => {
                        warn!(
                            "[View] Failed to save remote banner: {}\n=> Loading local banner.",
                            e
                        );
                    }
                }
            }

            if poster_path.exists() {
                manifest_data.poster = convert_file_src::new(&poster_path)?;
            }

            if banner_path.exists() {
                manifest_data.banner = convert_file_src::new(&banner_path)?;
            }
            /* --- */
        }

        let current_timestamp: usize = Utc::now().timestamp_millis() as usize;
        local_manifest.last_save_timestamp = Some(current_timestamp);
        if (current_timestamp - local_timestamp) >= CACHE_DELAY {
            save_local_manifest(source.clone(), id.clone(), local_manifest).await?;
        }
    }
    /* --- */

    return Ok(view_data);
}
