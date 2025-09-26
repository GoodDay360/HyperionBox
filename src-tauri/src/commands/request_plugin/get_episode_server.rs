use tracing::error;
use std::collections::HashMap;

use chlaty_core::request_plugin::get_episode_server;
use chlaty_core::request_plugin::get_episode_server::DataResult;

use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};

#[tauri::command]
pub async fn get_episode_server(source: String, id: String, plugin_id: String, season_index: usize, episode_index: usize, season_id: String, episode_id: String) -> Result<HashMap<String, Vec<DataResult>>, String> {
    
    let get_episode_server_result =  get_episode_server::new(&source, &plugin_id, &season_id, &episode_id)
        .map_err(|e| {error!("[get_episode_server] Error: {}", e); return e.to_string()})?;

    /* Update Current Watch */
    let mut local_manifest = get_local_manifest(source.clone(), id.clone()).await?;

    local_manifest.current_watch_season_index = Some(season_index);
    local_manifest.current_watch_episode_index = Some(episode_index);
    save_local_manifest(source, id, local_manifest).await?;

    /* --- */

    return Ok(get_episode_server_result);
}