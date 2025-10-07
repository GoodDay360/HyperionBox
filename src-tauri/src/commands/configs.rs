use crate::utils::configs::Configs;

#[tauri::command]
pub fn get_configs() -> Result<Configs, String> {
    let config_data = Configs::get()?;
    return Ok(config_data);
}

#[tauri::command]
pub fn set_configs(configs: Configs) -> Result<(), String> {
    Configs::set(configs)?;

    Configs::init()?;

    return Ok(());
}
