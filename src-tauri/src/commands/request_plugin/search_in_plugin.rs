use std::num::NonZeroUsize;
use tauri::async_runtime;
use chlaty_core::request_plugin::search;
use chlaty_core::request_plugin::search::DataResult;

#[tauri::command]
pub async fn search_in_plugin(source: String, plugin_id: String, search: String, page: NonZeroUsize) -> Result<Vec<DataResult>, String> {
    println!("{:?}| {:?} | {:?}", source.as_ptr(), plugin_id.as_ptr(), search.as_ptr());
    
    let search_result =  search::new(
        &source,
        &plugin_id,
        &search,
        page
    ).map_err(|e| e.to_string())?;


    return Ok(search_result);
}