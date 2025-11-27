use std::collections::HashMap;
use tauri::async_runtime;
use tracing::error;

use chlaty_core::manage_plugin;
use chlaty_core::manage_plugin::get_plugin_list::PluginInfo;

#[tauri::command]
pub async fn get_plugin_list_from_source(source: String) -> Result<HashMap<String, PluginInfo>, String> {
    let result = async_runtime::spawn_blocking(move || {
        let data = manage_plugin::get_plugin_list::new().map_err(|e| e.to_string())?;
        return data.get(&source).ok_or_else(||"[get_plugin_list_from_source] source not found!".to_string()).cloned();
    })
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Ok(get_plugin_list_result) => {
            return Ok(get_plugin_list_result)
        },
        Err(e) => {
            error!("[get_plugin_list] {}", e);
            return Err(e);
        }
    }
}

#[tauri::command]
pub async fn get_plugin_list() -> Result<HashMap<String, HashMap<String, PluginInfo>>, String> {
    let result = async_runtime::spawn_blocking(move || {
        return manage_plugin::get_plugin_list::new().map_err(|e| e.to_string());
    })
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Ok(get_plugin_list_result) => {
            return Ok(get_plugin_list_result)
        },
        Err(e) => {
            error!("[get_plugin_list] {}", e);
            return Err(e);
        }
    }
}