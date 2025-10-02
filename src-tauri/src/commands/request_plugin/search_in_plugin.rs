use chlaty_core::request_plugin::search;
use chlaty_core::request_plugin::search::DataResult;
use std::num::NonZeroUsize;

#[tauri::command]
pub async fn search_in_plugin(
    source: String,
    plugin_id: String,
    search: String,
    page: NonZeroUsize,
) -> Result<Vec<DataResult>, String> {
    let search_result =
        search::new(&source, &plugin_id, &search, page).map_err(|e| e.to_string())?;

    return Ok(search_result);
}
