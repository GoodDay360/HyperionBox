use serde_json::{from_reader, to_string_pretty};
use std::fs;
use std::io::BufReader;

use crate::models::local_manifest::LocalManifest;
use crate::utils::{configs, convert_file_src};

#[tauri::command]
pub async fn get_local_manifest(source: String, id: String) -> Result<LocalManifest, String> {
    let config_data = configs::get()?;

    let storage_dir = config_data.storage_dir;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    if !item_dir.exists() {
        fs::create_dir_all(&item_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = item_dir.join("manifest.json");

    if manifest_path.exists() {
        let file = fs::File::open(&manifest_path).map_err(|e| e.to_string())?;
        let reader = BufReader::new(file);

        let mut local_manifest_data: LocalManifest;
        match from_reader::<BufReader<std::fs::File>, LocalManifest>(reader)
            .map_err(|e| e.to_string())
        {
            Ok(data) => local_manifest_data = data,
            Err(_) => {
                local_manifest_data = LocalManifest::default();
            }
        }

        if let Some(manifest_data) = local_manifest_data.manifest_data.as_mut() {
            let storage_dir = configs::get()?.storage_dir;

            let item_dir = storage_dir.join(&source).join(&id);
            let poster_path = item_dir.join("poster.png");
            let banner_path = item_dir.join("banner.png");

            if poster_path.exists() {
                manifest_data.poster = convert_file_src::new(&poster_path)?;
            }

            if banner_path.exists() {
                manifest_data.banner = convert_file_src::new(&banner_path)?;
            }
        }   

        

        return Ok(local_manifest_data);
    } else {
        return Ok(LocalManifest::default());
    }
}

#[tauri::command]
pub async fn save_local_manifest(
    source: String,
    id: String,
    local_manifest_data: LocalManifest,
) -> Result<(), String> {
    let config_data = configs::get()?;

    let storage_dir = config_data.storage_dir;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    if !item_dir.exists() {
        fs::create_dir_all(&item_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = item_dir.join("manifest.json");

    let local_manifest_data_to_string =
        to_string_pretty(&local_manifest_data).map_err(|e| e.to_string())?;
    fs::write(&manifest_path, local_manifest_data_to_string).map_err(|e| e.to_string())?;

    return Ok(());
}
