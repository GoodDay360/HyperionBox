use std::path::PathBuf;

pub fn new(file_path: &PathBuf) -> Result<String, String> {
    #[cfg(any(windows, target_os = "android"))]
    let base = "http://asset.localhost/";

    #[cfg(not(any(windows, target_os = "android")))]
    let base = "asset://localhost/";

    // Windows/Android: canonicalize for absolute path resolution
    #[cfg(any(windows, target_os = "android"))]
    let path_str = {
        let path = dunce::canonicalize(file_path).map_err(|e| e.to_string())?;
        path.display().to_string()
    };

    // Linux/macOS: use raw path, strip leading slash
    #[cfg(not(any(windows, target_os = "android")))]
    let path_str = {
    let raw = file_path.display().to_string();
    let normalized = if raw.starts_with('/') {
        raw.to_string()
    } else {
        format!("/{}", raw)
    };
        normalized
    };

    let encoded = urlencoding::encode(&path_str);
    let url = format!("{base}{encoded}");

    Ok(url)
}
