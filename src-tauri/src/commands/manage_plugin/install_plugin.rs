use serde::{Deserialize, Serialize};
use tauri::async_runtime;
use tauri::Emitter;
use tracing::{error, warn};
use dashmap::DashMap;
use lazy_static::lazy_static;

use chlaty_core::manage_plugin;
use chlaty_core::manage_plugin::install_plugin::PluginManifest;


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payload {
    pub current: usize,
    pub total: usize,
}


lazy_static!{
    pub static ref CURRENT_INSTALLING_PLUGIN: DashMap<String, Vec<String>> = DashMap::new();
}


#[tauri::command]
pub async fn install_plugin(
    app: tauri::AppHandle,
    source: String,
    plugin_id: String,
    plugin_manifest: PluginManifest,
) -> Result<(), String> {
    if let Some(mut current_installing_source) = CURRENT_INSTALLING_PLUGIN.get_mut(&source) {
        if current_installing_source.contains(&plugin_id) {
            return Err("Plugin is already installing.".to_string())?;
        }else{
            current_installing_source.push(plugin_id.clone());
        }
    }else {
        CURRENT_INSTALLING_PLUGIN.insert(source.clone(), vec![plugin_id.clone()]);
    }

    
    let source_clone = source.clone();
    let plugin_id_clone = plugin_id.clone();

    let result = async_runtime::spawn_blocking(move || {
        return manage_plugin::install_plugin::new(
            &source_clone,
            &plugin_id_clone,
            "latest",
            plugin_manifest,
            |current, total| {
                match app.emit(
                    &format!("install_plugin_{}_{}", source_clone, plugin_id_clone),
                    Payload { current, total },
                ) {
                    Ok(_) => {}
                    Err(e) => warn!("[install_plugin] Emit Error: {}", e),
                }
            },
        ).map_err(|e| e.to_string());
    }).await.map_err(|e| e.to_string());

    if let Some(mut current_installing_source) = CURRENT_INSTALLING_PLUGIN.get_mut(&source) {
        if let Some(index) = current_installing_source.iter().position(|x| x == &plugin_id) {
            current_installing_source.remove(index);
        }
    }

    match result? {
        Ok(_) => return Ok(()),
        Err(e) => {
            error!("[install_plugin] {}", e);
            return Err(e.to_string());
        },
    }
}
