
use tauri::Emitter;
use serde::{Deserialize, Serialize};

use chlaty_core::manage_plugin::install_plugin;
use chlaty_core::manage_plugin::install_plugin::PluginManifest;


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payload {
    pub current: usize,
    pub total: usize
}

#[tauri::command]
pub fn install_plugin(app: tauri::AppHandle, source: String,plugin_id: String, plugin_manifest: PluginManifest) -> Result<(), String> {
    install_plugin::new(
        &source,
        &plugin_id,
        "latest",
        plugin_manifest,
        |current,total|{
            app.emit(&format!("install_plugin_{}_{}", source, plugin_id), Payload { current, total }).unwrap();
        }
    ).map_err(|e| e.to_string())?;
    return Ok(());
}