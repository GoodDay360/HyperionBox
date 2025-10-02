#[cfg(not(any(target_os = "android", target_os = "ios")))]
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn pick_dir(app: tauri::AppHandle) -> Result<Option<String>, String> {
    if cfg!(target_os = "android") || cfg!(target_os = "ios") {
        return pick_dir_cross_platform(app).await;
    } else {
        return pick_dir_cross_platform(app).await;
    }
}

#[cfg(any(target_os = "android", target_os = "ios"))]
async fn pick_dir_cross_platform(_app: tauri::AppHandle) -> Result<Option<String>, String> {
    return Err("Not yet supported.".to_string())?;
}


#[cfg(not(any(target_os = "android", target_os = "ios")))]
async fn pick_dir_cross_platform(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let selected_dir =  app.dialog().file().blocking_pick_folder();

    if let Some(dir) = selected_dir {
        return Ok(Some(dir.to_string()));
    }else{
        return Ok(None);
    }
}