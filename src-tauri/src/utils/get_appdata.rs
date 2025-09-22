
use std::env;
use std::path::PathBuf;

pub fn new() -> Result<PathBuf, String> {
    let appdata_dir = PathBuf::from(env::var("HYPERIONBOX_APPDATA")
        .map_err(|e| format!("Error getting 'HYPERIONBOX_APPDATA' environment: {}", e.to_string()))?);

    return Ok(appdata_dir);
}
