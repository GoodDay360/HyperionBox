
use std::env;
use std::path::PathBuf;
use tauri;

pub fn new() -> Result<PathBuf, String> {
    let context: tauri::Context<tauri::Wry> = tauri::generate_context!();
    let identifier = context.config().identifier.clone();
    let system_appdata_dir = PathBuf::from(env::var("APPDATA").map_err(|e| e.to_string())?);
    let appdata_dir = system_appdata_dir.join(identifier);

    return Ok(appdata_dir);
}
