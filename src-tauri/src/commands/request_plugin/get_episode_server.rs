use tracing::error;
use std::collections::HashMap;

use chlaty_core::request_plugin::get_episode_server;
use chlaty_core::request_plugin::get_episode_server::DataResult;

use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};
use crate::commands::favorite::update_timestamp_favorite;

#[tauri::command]
pub async fn get_episode_server(source: String, id: String, plugin_id: String, season_index: usize, episode_index: usize, episode_id: String) -> Result<HashMap<String, Vec<DataResult>>, String> {
    
    let get_episode_server_result =  get_episode_server::new(&source, &plugin_id, season_index, episode_index, &episode_id)
        .map_err(|e| {error!("[get_episode_server] Error: {}", e); return e.to_string()})?;

    /* Update Current Watch */
    let mut local_manifest = get_local_manifest(source.clone(), id.clone()).await?;

    local_manifest.current_watch_season_index = Some(season_index);
    local_manifest.current_watch_episode_index = Some(episode_index);
    save_local_manifest(source.clone(), id.clone(), local_manifest).await?;
    update_timestamp_favorite(source, id).await?;
    /* --- */

    return Ok(get_episode_server_result);
}