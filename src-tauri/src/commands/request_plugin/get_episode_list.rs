use chlaty_core::request_plugin::get_episode_list;
use chlaty_core::request_plugin::get_episode_list::DataResult;

use crate::commands::local_manifest::{get_local_manifest};

#[tauri::command]
pub async fn get_episode_list(
    source: String,
    id: String,
    plugin_id: String,
    link_id: String,
) -> Result<Vec<Vec<Vec<DataResult>>>, String> {

    let get_episode_list_result = match get_episode_list::new(&source, &plugin_id, &link_id).map_err(|e| e.to_string()) {
        Ok(data) => data,
        Err(_) => {
            let local_manifest = get_local_manifest(source.clone(), id.clone()).await?;
            println!("{:?}", local_manifest);
            let manifest_data = local_manifest.manifest_data.ok_or("Local Manifest also not exist.")?;
            manifest_data.episode_list.ok_or("Local episode list also not exist.")?
        }
    };
    

    return Ok(get_episode_list_result);
}
