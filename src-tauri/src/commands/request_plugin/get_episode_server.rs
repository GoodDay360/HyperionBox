use std::collections::HashMap;
use tracing::error;
use chlaty_core::request_plugin;
use chlaty_core::request_plugin::get_episode_server::DataResult;


#[tauri::command]
pub async fn get_episode_server(
    source: String,
    plugin_id: String,
    season_index: usize,
    episode_index: usize,
    episode_id: String,
) -> Result<HashMap<String, Vec<DataResult>>, String> {
    let get_episode_server_result = request_plugin::get_episode_server::new(
        &source,
        &plugin_id,
        season_index,
        episode_index,
        &episode_id,
    )
    .map_err(|e| {
        error!("[get_episode_server] Error: {}", e);
        return e.to_string();
    })?;

    return Ok(get_episode_server_result);
}
