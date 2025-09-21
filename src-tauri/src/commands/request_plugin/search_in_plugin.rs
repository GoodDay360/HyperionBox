use std::num::NonZeroUsize;
use tauri::async_runtime;
use chlaty_core::request_plugin::search;
use chlaty_core::request_plugin::search::DataResult;

#[tauri::command]
pub async fn search_in_plugin(source: String, plugin_id: String, search: String, page: NonZeroUsize) -> Result<Vec<DataResult>, String> {
    let result = async_runtime::spawn_blocking(move || {
        return search::new(
            &source,
            &plugin_id,
            &search,
            page
        ).map_err(|e| e.to_string());
    }).await.map_err(|e| e.to_string())?;
    
    let search_result = result?;

    return Ok(search_result);
}