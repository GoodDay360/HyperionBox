use tokio;
use tracing::{warn, error};


use chlaty_core::request_plugin::get_episode_list::DataResult;

use crate::anime;
use crate::commands::request_plugin::get_episode_list::get_episode_list;
use crate::models::home::HomeData;
use crate::models::search::SearchData;
use crate::models::view::{ViewData, ManifestData};
use crate::models::local_manifest::LocalManifest;
use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};
use crate::commands::favorite::get_tag_from_favorite;

#[tauri::command]
pub async fn home(source: String) -> Result<HomeData, String> {
    if source == "anime" {
        match anime::home::new().await {
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

        view_data = ViewData { manifest_data: Some(manifest_data), link_plugin: local_manifest.link_plugin.clone() };
    }else {
        match task_get_view_manifest_data.await {
            Ok(data) => {
                view_data = ViewData { manifest_data: Some(data), link_plugin: None };
            },
            Err(e) => {
                error!("[Get View Data] Error: {}", e);
                return Err(e);
            }
        }
    }

    let favoriate_tag = get_tag_from_favorite(source.clone(), id.clone()).await?;
    if favoriate_tag.len() > 0 {
        local_manifest.manifest_data = view_data.manifest_data.clone();
        save_local_manifest(source.clone(), id.clone(), local_manifest).await?;
        
        if let Some(mut manifest_data) =  view_data.manifest_data {
            manifest_data.meta_data.insert(0, format!("Favorite: {}", favoriate_tag.join(", ")));
            view_data.manifest_data = Some(manifest_data);
        }
    }

    

    return Ok(view_data);
    
}
