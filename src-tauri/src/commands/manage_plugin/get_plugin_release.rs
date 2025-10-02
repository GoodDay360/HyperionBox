use tauri::async_runtime;

use chlaty_core::manage_plugin::get_plugin_release;
use chlaty_core::manage_plugin::get_plugin_release::GetPluginRelease;

#[tauri::command]
pub async fn get_plugin_release(
    manifest_url: String,
    version: String,
) -> Result<GetPluginRelease, String> {
    let result = async_runtime::spawn_blocking(move || {
        return get_plugin_release::new(&manifest_url, &version).map_err(|e| e.to_string());
    })
    .await
    .map_err(|e| e.to_string())?;

    let get_plugin_release_result = result?;

    return Ok(get_plugin_release_result);
}
