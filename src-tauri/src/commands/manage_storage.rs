use fs_extra::dir::get_size;
use std::fs;

use crate::utils::configs::Configs;
use crate::commands::favorite;

#[tauri::command]
pub async fn get_storage_size() -> Result<usize, String> {
    let app_configs = Configs::get()?;
    let storage_dir = app_configs.storage_dir.ok_or("Storage directory not set".to_string())?;

    let mut storage_size: usize = 0;

    if storage_dir.exists() {
        match get_size(&storage_dir) {
            Ok(size) => storage_size += size as usize,
            Err(e) => return Err(e.to_string()),
        }
    }else {
        storage_size += 0;
    }

    let cache_dir = app_configs.cache_dir.ok_or("Cache directory not set".to_string())?;

    if cache_dir.exists() {
        match get_size(&cache_dir) {
            Ok(size) => storage_size += size as usize,
            Err(e) => return Err(e.to_string()),
        }
    }else {
        storage_size += 0;
    }

    return Ok(storage_size);

}

#[tauri::command]
pub async fn clean_storage() -> Result<(), String> {
    let app_configs = Configs::get()?;

    /* Clean Cache Dir */
    let cache_dir = app_configs.cache_dir.ok_or("Cache dir not set!")?;
    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    
    /* --- */

    /* Clean all item that not in favorite */
    let storage_dir = app_configs.storage_dir.ok_or("Storage directory not set".to_string())?;

    let favorite_data = favorite::get_all_item_from_favorite()?;


    let mut favorite_source_data: Vec<String> = Vec::new();
    let mut favorite_id_data: Vec<String> = Vec::new();

    for item in favorite_data {
        favorite_source_data.push(item.source);
        favorite_id_data.push(item.id);
    }
    
    let entries = fs::read_dir(&storage_dir).map_err(|e|e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e|e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            let folder_name = path.file_name().ok_or("Fail to get folder name")?.to_string_lossy().to_string();
            if !favorite_source_data.contains(&folder_name) {
                fs::remove_dir_all(path).map_err(|e|e.to_string())?;
            }else{
                let current_source_dir = storage_dir.join(&folder_name);
                let current_source_entries = fs::read_dir(&current_source_dir).map_err(|e|e.to_string())?;
                for current_source_entry in current_source_entries {
                    let current_source_entry = current_source_entry.map_err(|e|e.to_string())?;
                    let path = current_source_entry.path();
                    if path.is_dir() {
                        let folder_name = path.file_name().ok_or("Fail to get folder name")?.to_string_lossy().to_string();
                        if !favorite_id_data.contains(&folder_name) {
                            fs::remove_dir_all(path).map_err(|e|e.to_string())?;
                        }
                    }
                }
            }
        }
    }
    /* --- */



    return Ok(())
}