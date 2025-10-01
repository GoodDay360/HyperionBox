use tokio;
use tracing::{warn, error};


use chlaty_core::request_plugin::get_episode_list::DataResult;

use crate::anime;
use crate::commands::request_plugin::get_episode_list::get_episode_list;
use crate::models::home::{HomeData, ContentData, Content};
use crate::models::search::SearchData;
use crate::models::view::{ViewData, ManifestData};
use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};
use crate::commands::favorite::{get_tag_from_favorite, get_recent_from_favorite};


#[tauri::command]
pub async fn home(source: String) -> Result<HomeData, String> {
    let mut _home_data: HomeData = HomeData { relevant_content: vec![], content: vec![] };
    if source == "anime" {
        match anime::home::new().await {
            Ok(data) => _home_data = data,
            Err(e) => {
                error!("[HOME] Error: {}", e);
                return Err(e)?;
            }
        }
    }
    else{
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
        content_data.insert(0, Content {
            label: "Continuous Watching".to_string(),
            data: recent_content_data,
        });
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
    }else{
        return Err("Unkown Source".to_string());
    }
    /* --- */

    let mut local_manifest = get_local_manifest(source.clone(), id.clone()).await?;
    let mut link_plugin_id: String = String::new();
    let mut link_id: String = String::new();

    if let Some(link_plugin) = local_manifest.link_plugin.clone() {
        link_plugin_id = link_plugin.plugin_id.unwrap_or("".to_string());
        link_id = link_plugin.id.unwrap_or("".to_string());
    }

    let mut view_data: ViewData;

    if !link_plugin_id.is_empty() && !link_id.is_empty() {
        let (task_get_view_manifest_data, task_get_episode_list) = tokio::join!(
            task_get_view_manifest_data, get_episode_list(source.clone(), link_plugin_id.clone(), link_id)
        );
        let mut manifest_data: ManifestData = task_get_view_manifest_data?;

        let episode_list: Vec<Vec<Vec<DataResult>>>;
        match task_get_episode_list {
            Ok(data) => episode_list = data,
            Err(e) => {
                warn!("[Get Episode List] Error: {}", e);
                episode_list = vec![];
            }
        };
        manifest_data.episode_list = Some(episode_list);
        manifest_data.meta_data.insert(0, format!("Plugin: {}", link_plugin_id));

        view_data = ViewData { 
            manifest_data: Some(manifest_data), 
            link_plugin: local_manifest.link_plugin.clone(),
            current_watch_episode_index: None,
            current_watch_season_index: None
        };
    }else {
        match task_get_view_manifest_data.await {
            Ok(data) => {
                view_data = ViewData { 
                    manifest_data: Some(data), 
                    link_plugin: None,
                    current_watch_episode_index: None,
                    current_watch_season_index: None
                };
            },
            Err(e) => {
                error!("[Get View Data] Error: {}", e);
                return Err(e);
            }
        }
    }

    view_data.current_watch_season_index = local_manifest.current_watch_season_index;
    view_data.current_watch_episode_index = local_manifest.current_watch_episode_index;
    

    let favoriate_tag = get_tag_from_favorite(source.clone(), id.clone()).await?;
    if favoriate_tag.len() > 0 {
        local_manifest.manifest_data = view_data.manifest_data.clone();
        save_local_manifest(source.clone(), id.clone(), local_manifest).await?;
        
        /* Insert Plugin Info */
        if let Some(mut manifest_data) = view_data.manifest_data {
            manifest_data.meta_data.insert(0, format!("Favorite: {}", favoriate_tag.join(", ")));
            view_data.manifest_data = Some(manifest_data);
        }
        /* --- */
    }

    

    return Ok(view_data);
    
}
