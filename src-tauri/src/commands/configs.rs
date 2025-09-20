use crate::utils::configs;
use crate::utils::configs::{Configs};

#[tauri::command]
pub fn get_configs() -> Result<Configs, String> {
    let config_data = configs::get()?;
    return Ok(config_data);
}

#[tauri::command]
pub fn set_configs(config_data: Configs) -> Result<(), String> {
    configs::set(config_data)?;
    return Ok(());
}

