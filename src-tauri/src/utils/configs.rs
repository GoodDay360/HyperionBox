
use std::{env};
use std::path::PathBuf;
use std::fs;
use std::io::BufReader;
use serde::{Deserialize, Serialize};
use serde_json::{from_reader, to_string_pretty};

use crate::utils::get_appdata;




#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Configs {
    pub plugin_dir: PathBuf,
    pub storage_dir: PathBuf,
}

impl Configs {
    pub fn default() -> Result<Configs, String> {
        let appdata_dir = get_appdata::new()?;

        let plugin_dir = appdata_dir.join("plugins").to_string_lossy().to_string();
        let storage_dir = appdata_dir.join("storage").to_string_lossy().to_string();

        return Ok(Configs {
            plugin_dir: PathBuf::from(plugin_dir),
            storage_dir: PathBuf::from(storage_dir),
        })
    }
}



pub fn get() -> Result<Configs, String> {
    
    let appdata_dir = get_appdata::new()?;

    if !appdata_dir.exists() {
        fs::create_dir_all(&appdata_dir).map_err(|e| e.to_string())?;
    }

    let config_data: Configs;

    let config_file = appdata_dir.join("configs.json");
    if config_file.exists() {
        let file = fs::File::open(&config_file).map_err(|e| e.to_string())?;
        let reader = BufReader::new(file);
        match from_reader::<BufReader<std::fs::File>, Configs>(reader) {
            Ok(data) => config_data = data,
            Err(_) => {
                config_data = Configs::default().map_err(|e| e.to_string())?;
                let config_data_to_string = to_string_pretty(&config_data).map_err(|e| e.to_string())?;
                fs::write(&config_file, config_data_to_string).map_err(|e| e.to_string())?;
            }
        }
    }else{
        config_data = Configs::default().map_err(|e| e.to_string())?;
        let config_data_to_string = to_string_pretty(&config_data).map_err(|e| e.to_string())?;
        fs::write(&config_file, config_data_to_string).map_err(|e| e.to_string())?;
    }


    return Ok(config_data);
}

pub fn set(configs: Configs) -> Result<(), String> {
    
    let appdata_dir = get_appdata::new()?;

    let config_file = appdata_dir.join("configs.json");
    let config_data_to_string = to_string_pretty(&configs).map_err(|e| e.to_string())?;
    fs::write(&config_file, config_data_to_string).map_err(|e| e.to_string())?;

    return Ok(());
}

pub fn init() -> Result<(), String> {
    println!("Init Configs");

    
    let config_data = get()?;
    env::set_var("CHLATY_PLUGIN_DIRECTORY", &config_data.plugin_dir);
    env::set_var("CHLATY_STORAGE_DIRECTORY", &config_data.storage_dir);

    println!("ALL PATH: {} | {}", &config_data.plugin_dir.display(), &config_data.storage_dir.display());
    
    return Ok(());
}