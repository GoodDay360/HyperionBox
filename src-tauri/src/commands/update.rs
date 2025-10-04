use tauri::Emitter;

use tracing::warn;

// Update is on rust side because I need a way to implment cross platform updater

#[tauri::command]
pub async fn update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    update_cross_platform(app).await
}

#[cfg(not(target_os = "android"))]
async fn update_cross_platform(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use crate::models::update::UpdateProgress;
    use tauri_plugin_updater::UpdaterExt;

    if let Some(update) = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?
    {
        let mut downloaded = 0;

        update
            .download_and_install(
                |chunk_length, content_length| {
                    let total = content_length.unwrap_or(0);
                    downloaded += chunk_length;

                    match app.emit(
                        "update_progress",
                        UpdateProgress {
                            current: downloaded,
                            total: total as usize,
                        },
                    ) {
                        Ok(_) => {}
                        Err(e) => warn!("[update]: {}", e),
                    }
                },
                || {},
            )
            .await
            .map_err(|e| e.to_string())?;
        println!("Update Installed.");
        app.restart();
    }

    Ok(None)
}

#[cfg(target_os = "android")]
async fn update_cross_platform(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use reqwest::header::HeaderMap;
    use reqwest::Client;
    use std::fs;
    use tauri::Manager;
    use tauri_plugin_os::{platform, arch};

    use crate::models::update::{UpdateManifest, UpdateProgress};
    use crate::utils::download_file;

    let client = Client::new();
    let response = client
        .get("https://github.com/GoodDay360/HyperionBox/releases/latest/download/latest.json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let update_manifest: UpdateManifest = response.json().await.map_err(|e| e.to_string())?;

        let android_arch = match arch() {
                "arm" => "armeabi-v7a",
                "aarch64" => "arm64-v8a",
                "x86" => "x86",
                "x86_64" => "x86_64",
                _ => Err("Unsupported architecture".to_string())?,
        };

        // println!("{}", format!("{}-{}", platform(), android_arch));

        let selected = update_manifest
            .platforms
            .get(&format!("{}-{}", platform(), android_arch))
            .ok_or("Platform not found")?;

        let files_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?
            .join("files");
        if !files_dir.exists() {
            fs::create_dir_all(&files_dir).map_err(|e| e.to_string())?;
        }

        let output_file = files_dir.join("hyperionbox-update.apk");

        let headers = HeaderMap::new();
        download_file::new(&selected.url, &output_file, headers, |current, total| {
            match app.emit("update_progress", UpdateProgress { current, total }) {
                Ok(_) => {}
                Err(e) => warn!("[update]: {}", e),
            };
        })
        .await?;

        return Ok(Some(output_file.display().to_string()));
    }

    return Err("[Update] error requesting update".to_string())?;
}
