use chlaty_core::request_plugin::get_episode_list;
use chlaty_core::request_plugin::get_episode_list::DataResult;

#[tauri::command]
pub async fn get_episode_list(
    source: String,
    plugin_id: String,
    id: String,
) -> Result<Vec<Vec<Vec<DataResult>>>, String> {
    let get_episode_list_result =
        get_episode_list::new(&source, &plugin_id, &id).map_err(|e| e.to_string())?;

    return Ok(get_episode_list_result);
}
