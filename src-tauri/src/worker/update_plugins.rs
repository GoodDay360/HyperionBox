use tauri::AppHandle;
use serde::{Deserialize, Serialize};
use serde_json::{from_reader, to_writer};
use tokio::time::{sleep, Duration};
use tracing::{error, info};
use std::fs;
use chrono::Utc;
use semver::{Version};

use chlaty_core::manage_plugin::install_plugin::PluginManifest;

use crate::commands::manage_plugin::{
    get_plugin_list::get_plugin_list, 
    get_installed_plugin_list::get_installed_plugin_list,
    get_plugin_release::get_plugin_release,
    install_plugin::install_plugin
};
use crate::utils::configs::Configs;



#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluginUpdateCache {
    pub last_update_timestamp: usize,
}


const CHECK_UPDATE_DELAY: usize = 10 * 60 * 1000; // minute to ms


async fn get_plugin_update_cache(source: &str, plugin_id: &str) -> Result<PluginUpdateCache, String>{
    let app_configs = Configs::get()?;

    let cache_dir = app_configs.cache_dir.ok_or("Cache dir not setup yet!")?;

    let plugin_update_cache_path = cache_dir.join("updates").join("plugins").join(source).join(format!("{}.json", plugin_id));

    let cache_file = fs::File::open(&plugin_update_cache_path).map_err(|e| e.to_string())?;
    let cache: PluginUpdateCache = from_reader(cache_file).map_err(|e| e.to_string())?;

    return Ok(cache)
}

async fn save_plugin_update_cache(source: &str, plugin_id: &str) -> Result<(), String>{
    let app_configs = Configs::get()?;

    let cache_dir = app_configs.cache_dir.ok_or("Cache dir not setup yet!")?;

    let plugin_update_cache_dir = cache_dir.join("updates").join("plugins").join(source);

    if !plugin_update_cache_dir.exists() {
        fs::create_dir_all(&plugin_update_cache_dir).map_err(|e| e.to_string())?;
    }

    let plugin_update_cache_path = plugin_update_cache_dir.join(format!("{}.json", plugin_id));
    
    let current_timestamp = Utc::now().timestamp_millis() as usize;
    let plugin_update_cache = PluginUpdateCache { last_update_timestamp: current_timestamp };

    let cache_file = fs::File::create(&plugin_update_cache_path).map_err(|e| e.to_string())?;
    to_writer(cache_file, &plugin_update_cache).map_err(|e| e.to_string())?;

    return Ok(());
}

async fn update(app: AppHandle) -> Result<(), String> {
    let plugin_list = get_plugin_list().await?;

    for source in plugin_list.keys(){
        let installed_plugin_list = get_installed_plugin_list(source.to_string()).await?;
        
        for installed_plugin_id in installed_plugin_list.keys(){
            let plugin_update_cache = match get_plugin_update_cache(source, installed_plugin_id).await {
                Ok(cache) => cache,
                Err(_) => {
                    PluginUpdateCache { last_update_timestamp: 0 }
                }
            };

            let current_timestamp = Utc::now().timestamp_millis() as usize;

            if (current_timestamp - plugin_update_cache.last_update_timestamp) < CHECK_UPDATE_DELAY{
                continue;
            }

            let installed_plugin_info = installed_plugin_list.get(installed_plugin_id).unwrap();

            let plugin_info = match plugin_list.get(source)
                .and_then(|t| t.get(installed_plugin_id)){
                    Some(info) => info,
                    None => {
                        continue;
                    }
                };
            
            let installed_plugin_version = Version::parse(&installed_plugin_info.version).map_err(|e| e.to_string())?;
            let plugin_release = match get_plugin_release(plugin_info.manifest.clone(), "latest".to_string()).await {
                Ok(release) => release,
                Err(_) => {
                    continue;
                }
            };

            let latest_plugin_version = Version::parse(&plugin_release.version).map_err(|e| e.to_string())?;
            

            if latest_plugin_version <= installed_plugin_version{
                info!("[Worker::UpdatePlugin]: Plugin {} from source {} is up to date", installed_plugin_id, source);
                match save_plugin_update_cache(source, installed_plugin_id).await {
                    Ok(()) => {
                        info!("[Worker::UpdatePlugin]: Saved update cache for plugin {} from source {}", installed_plugin_id, source);
                    }
                    Err(e) => {
                        error!("[Worker::UpdatePlugin]: Failed to save update cache for plugin {} from source {}: {}", installed_plugin_id, source, e);
                    }
                }
                continue;
            }

            match install_plugin(
                app.clone(),
                source.to_string(),
                installed_plugin_id.to_string(),
                PluginManifest { title: plugin_info.title.clone(), manifest: plugin_info.manifest.clone() },
            ).await {
                Ok(()) => {
                    info!("[Worker::UpdatePlugin]: Installed plugin {} from source {}", installed_plugin_id, source);
                }
                Err(e) => {
                    error!("[Worker::UpdatePlugin]: Failed to install plugin {} from source {}: {}", installed_plugin_id, source, e);
                    continue;
                }
            }

            match save_plugin_update_cache(source, installed_plugin_id).await {
                Ok(()) => {
                    info!("[Worker::UpdatePlugin]: Saved update cache for plugin {} from source {}", installed_plugin_id, source);
                }
                Err(e) => {
                    error!("[Worker::UpdatePlugin]: Failed to save update cache for plugin {} from source {}: {}", installed_plugin_id, source, e);
                    continue;
                }
            }
        }
        

    }
    return Ok(());
}

pub async fn new(app: AppHandle) {
    loop {
        {
            match update(app.clone()).await {
                Ok(()) => {
                    info!("[Worker::UpdatePlugin]: All tasks completed successfully.");
                }
                Err(e) => {
                    error!("[Worker::UpdatePlugin]: {}", e);
                },
            }
        }
        sleep(Duration::from_secs(30 * 60)).await;
    }
}