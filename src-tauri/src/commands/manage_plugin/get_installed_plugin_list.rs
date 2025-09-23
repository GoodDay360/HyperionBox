use tauri::async_runtime;
use std::collections::HashMap;
use chlaty_core::manage_plugin::get_installed_plugin_list;
use chlaty_core::utils::manifest::PluginInfo;


#[tauri::command]
pub async fn get_installed_plugin_list(source: String) -> Result<HashMap<String, PluginInfo>, String> {
    let result = async_runtime::spawn_blocking(move || {
        return get_installed_plugin_list::new(&source).map_err(|e| e.to_string());
    }).await.map_err(|e| e.to_string())?;

    let get_installed_plugin_list_result = result?;
    return Ok(get_installed_plugin_list_result);
}