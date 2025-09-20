use std::num::NonZeroUsize;
use chlaty_core::request_plugin::search;
use chlaty_core::request_plugin::search::DataResult;

pub fn new(source: String, plugin_id: String, search: String, page: NonZeroUsize) -> Result<Vec<DataResult>, String> {
    let search_result = search::new(
        &source,
        &plugin_id,
        &search,
        page
    ).map_err(|e| e.to_string())?;

    return Ok(search_result);
}