use std::collections::HashMap;

use chlaty_core::manage_plugin::get_plugin_list;
use chlaty_core::manage_plugin::get_plugin_list::PluginInfo;

#[tauri::command]
pub fn get_plugin_list(source: String) -> Result<HashMap<String, PluginInfo>, String> {
    let get_plugin_list_result = get_plugin_list::new(&source).map_err(|e| e.to_string())?;

    return Ok(get_plugin_list_result);
}