use serde::{Deserialize, Serialize};
use serde_json::{from_reader, to_string_pretty};
use std::env;
use std::fs;
use std::io::BufReader;
use std::path::PathBuf;

use crate::utils::get_appdata;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Configs {
    pub plugin_dir: Option<PathBuf>,
    pub storage_dir: Option<PathBuf>,
    pub cache_dir: Option<PathBuf>,
    pub selected_source_id: Option<String>,
    pub download_worker_threads: Option<usize>,
}



impl Configs {
    pub fn is_all_set(&self) -> bool {
        return self.plugin_dir.is_some() 
            && self.storage_dir.is_some()
            && self.cache_dir.is_some()
            && self.selected_source_id.is_some()
            && self.download_worker_threads.is_some();
    }

    pub fn init() -> Result<(), String> {
        let config_data = Configs::get()?;
        let plugin_dir = config_data.plugin_dir.ok_or("Plugin directory not set".to_string())?;
        let storage_dir = config_data.storage_dir.ok_or("Storage directory not set".to_string())?;
        env::set_var("CHLATY_PLUGIN_DIRECTORY", &plugin_dir);
        env::set_var("CHLATY_STORAGE_DIRECTORY", &storage_dir);

        return Ok(());
    }

    pub fn default() -> Result<Configs, String> {
        let appdata_dir = get_appdata::new()?;

        let plugin_dir = appdata_dir.join("plugins").to_string_lossy().to_string();
        let storage_dir = appdata_dir.join("storage").to_string_lossy().to_string();
        let cache_dir = appdata_dir.join("cache").to_string_lossy().to_string();

        return Ok(Configs {
            plugin_dir: Some(PathBuf::from(plugin_dir)),
            storage_dir: Some(PathBuf::from(storage_dir)),
            cache_dir: Some(PathBuf::from(cache_dir)),
            selected_source_id: Some("anime".to_string()),
            download_worker_threads: Some(3),
        });
    }

    pub fn get() -> Result<Configs, String> {
        let appdata_dir = get_appdata::new()?;

        if !appdata_dir.exists() {
            fs::create_dir_all(&appdata_dir).map_err(|e| e.to_string())?;
        }

        let mut config_data: Configs;

        let config_file = appdata_dir.join("configs.json");
        if config_file.exists() {
            let file = fs::File::open(&config_file).map_err(|e| e.to_string())?;
            let reader = BufReader::new(file);
            match from_reader::<BufReader<std::fs::File>, Configs>(reader) {
                Ok(data) => config_data = data,
                Err(_) => {
                    config_data = Configs::default().map_err(|e| e.to_string())?;
                    let config_data_to_string =
                        to_string_pretty(&config_data).map_err(|e| e.to_string())?;
                    fs::write(&config_file, config_data_to_string).map_err(|e| e.to_string())?;
                }
            }
        } else {
            config_data = Configs::default().map_err(|e| e.to_string())?;
            let config_data_to_string = to_string_pretty(&config_data).map_err(|e| e.to_string())?;
            fs::write(&config_file, config_data_to_string).map_err(|e| e.to_string())?;
        }

        /* Fix non existing key-value */
        let default_configs = Configs::default().map_err(|e| e.to_string())?;
        if config_data.plugin_dir.is_none() {
            config_data.plugin_dir = default_configs.plugin_dir;
        }
        if config_data.storage_dir.is_none() {
            config_data.storage_dir = default_configs.storage_dir;
        }

        if config_data.cache_dir.is_none() {
            config_data.cache_dir = default_configs.cache_dir;
        }

        if config_data.selected_source_id.is_none() {
            config_data.selected_source_id = default_configs.selected_source_id;
        }
        if config_data.download_worker_threads.is_none() {
            config_data.download_worker_threads = default_configs.download_worker_threads;
        }
        /* --- */

        return Ok(config_data);
    }

    pub fn set(&self) -> Result<(), String> {
        if !Configs::is_all_set(self) {
            return Err("Not all configs are set".to_string());
        }
        let appdata_dir = get_appdata::new()?;

        let config_file = appdata_dir.join("configs.json");
        let config_data_to_string = to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(&config_file, config_data_to_string).map_err(|e| e.to_string())?;

        return Ok(());
    }

    

}



