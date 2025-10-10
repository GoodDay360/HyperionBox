use tauri::async_runtime;
use tracing::error;

use chlaty_core::manage_plugin;
use chlaty_core::manage_plugin::get_plugin_release::GetPluginRelease;

#[tauri::command]
pub async fn get_plugin_release(
    manifest_url: String,
    version: String,
) -> Result<GetPluginRelease, String> {
    let result = async_runtime::spawn_blocking(move || {
        return manage_plugin::get_plugin_release::new(&manifest_url, &version).map_err(|e| e.to_string());
    })
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Ok(get_plugin_release_result) => return Ok(get_plugin_release_result),
        Err(e) => {
            error!("[get_plugin_release] {}", e);
            return Err(e);
        }
    }
}
