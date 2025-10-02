use chlaty_core::manage_plugin::remove_plugin;

#[tauri::command]
pub async fn remove_plugin(source: String, plugin_id: String) -> Result<(), String> {
    remove_plugin::new(&source, &plugin_id).map_err(|e| e.to_string())?;

    return Ok(());
}
