use serde::{Deserialize, Serialize};
use tauri::async_runtime;
use tauri::Emitter;
use tracing::{error, warn};

use chlaty_core::manage_plugin;
use chlaty_core::manage_plugin::install_plugin::PluginManifest;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payload {
    pub current: usize,
    pub total: usize,
}

#[tauri::command]
pub async fn install_plugin(
    app: tauri::AppHandle,
    source: String,
    plugin_id: String,
    plugin_manifest: PluginManifest,
) -> Result<(), String> {
    let result = async_runtime::spawn_blocking(move || {
        return manage_plugin::install_plugin::new(
            &source,
            &plugin_id,
            "latest",
            plugin_manifest,
            |current, total| {
                match app.emit(
                    &format!("install_plugin_{}_{}", source, plugin_id),
                    Payload { current, total },
                ) {
                    Ok(_) => {}
                    Err(e) => warn!("[install_plugin] Emit Error: {}", e),
                }
            },
        ).map_err(|e| e.to_string());
    }).await.map_err(|e| e.to_string())?;

    match result {
        Ok(_) => return Ok(()),
        Err(e) => {
            error!("[install_plugin] {}", e);
            return Err(e.to_string());
        },
    }
}
