use tokio;
use tracing::{warn, error};


use chlaty_core::request_plugin::get_episode_list::DataResult;

use crate::anime;
use crate::commands::request_plugin::get_episode_list::get_episode_list;
use crate::models::home::HomeData;
use crate::models::search::SearchData;
use crate::models::view::{ViewData};
use crate::commands::local_manifest::{get_local_manifest};

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
        match anime::search::new(page, search).await {
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
    if source == "anime" {


        let local_manifest = get_local_manifest(source.clone(), id.clone())?;


        let mut link_plugin_id: String = String::new();
        let mut link_id: String = String::new();

        if let Some(link_plugin) = local_manifest.link_plugin {
            link_plugin_id = link_plugin.plugin_id.unwrap_or("".to_string());
            link_id = link_plugin.id.unwrap_or("".to_string());
        }

        if !link_plugin_id.is_empty() && !link_id.is_empty() {
            let (task_get_view_data, task_get_episode_list) = tokio::join!(
                anime::view::new(id), get_episode_list(source, link_plugin_id, link_id)
            );

            let mut view_data = task_get_view_data?;

            let episode_list: Vec<Vec<Vec<DataResult>>>;
            match task_get_episode_list {
                Ok(data) => episode_list = data,
                Err(e) => {
                    warn!("[Get Episode List] Error: {}", e);
                    episode_list = vec![];
                }
            };
            view_data.episode_list = Some(episode_list);
            return Ok(view_data);
        }else {
            match anime::view::new(id).await {
                Ok(data) => return Ok(data),
                Err(e) => {
                    error!("[Get View Data] Error: {}", e);
                    return Err(e);
                }
            }
        }

        
        


    }
    return Err("Unkown Source".to_string());
}
