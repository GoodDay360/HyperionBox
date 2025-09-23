use std::collections::HashMap;

use chlaty_core::request_plugin::get_episode_server;
use chlaty_core::request_plugin::get_episode_server::DataResult;

#[tauri::command]
pub async fn get_episode_server(source: String, plugin_id: String, id: String) -> Result<HashMap<String, Vec<DataResult>>, String> {
    
    let get_episode_server_result =  get_episode_server::new(&source, &plugin_id, &id)
        .map_err(|e| e.to_string())?;

    return Ok(get_episode_server_result);
}