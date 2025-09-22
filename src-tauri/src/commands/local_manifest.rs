
use std::fs;
use std::io::BufReader;
use std::path::PathBuf;
use serde_json::{Value, json, to_string_pretty, from_reader};
use tracing::{warn};
use std::collections::HashMap;

use crate::utils::get_appdata;
use crate::utils::configs;
use crate::models::local_manifest::{LocalManifest, LinkPlugin};

#[tauri::command]
pub fn get_local_manifest(source: String, id: String) -> Result<LocalManifest, String> {
    let config_data = configs::get()?;

    let storage_dir = config_data.storage_dir;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    if !item_dir.exists() {
        fs::create_dir_all(&item_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = item_dir.join("manifest.json");

    if !manifest_path.exists() {
        fs::write(&manifest_path, "{}").map_err(|e| e.to_string())?;
    }

    let file = fs::File::open(&manifest_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);

    let manifest_data: LocalManifest;
    match from_reader::<BufReader<std::fs::File>, LocalManifest>(reader).map_err(|e| e.to_string()) {
        Ok(data) => manifest_data = data,
        Err(_) => {
            manifest_data = LocalManifest::default();
        }
    }

    return Ok(manifest_data);
}

#[tauri::command]
pub fn save_local_manifest(source: String, id: String, manifest_data: LocalManifest) -> Result<(), String> {
    let config_data = configs::get()?;

    let storage_dir = config_data.storage_dir;
    let source_dir = storage_dir.join(&source);
    let item_dir = source_dir.join(&id);
    if !item_dir.exists() {
        fs::create_dir_all(&item_dir).map_err(|e| e.to_string())?;
    }

    let manifest_path = item_dir.join("manifest.json");

    let manifest_data_to_string = to_string_pretty(&manifest_data).map_err(|e| e.to_string())?;
    fs::write(&manifest_path, manifest_data_to_string).map_err(|e| e.to_string())?;

    return Ok(());
}

