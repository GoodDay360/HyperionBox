use chlaty_core::request_plugin::get_server;
use chlaty_core::request_plugin::get_server::ServerResult;

#[tauri::command]
pub async fn get_server(source: String, plugin_id: String, id: String) -> Result<ServerResult, String> {
    // Note: id is server_id.
    
    let get_server_result =  get_server::new(&source, &plugin_id, &id)
        .map_err(|e| e.to_string())?;

    return Ok(get_server_result);
}