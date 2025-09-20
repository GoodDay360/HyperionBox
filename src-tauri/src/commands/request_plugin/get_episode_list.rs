use std::collections::HashMap;

use chlaty_core::request_plugin::get_episode_list;
use chlaty_core::request_plugin::get_episode_list::DataResult;

// pub fn new(source: String) -> Result<HashMap<String, DataResult>, String> {
//     let get_episode_list_result = get_episode_list::new(&source)
//         .map_err(|e| e.to_string())?;
//     return Ok(get_plugin_list_result);
// }