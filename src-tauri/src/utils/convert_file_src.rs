use std::path::PathBuf;

pub fn new(file_path: &PathBuf) -> Result<String, String> {
    #[cfg(any(windows, target_os = "android"))]
    let base = "http://asset.localhost/";
    #[cfg(not(any(windows, target_os = "android")))]
    let base = "asset://localhost/";

    let path = dunce::canonicalize(file_path).map_err(|e| e.to_string())?;
    let path_to_string = path.display().to_string();
    let encoded = urlencoding::encode(&path_to_string);

    let url = format!("{base}{encoded}");

    return Ok(url);
}
