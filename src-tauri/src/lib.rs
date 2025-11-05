use dotenv::dotenv;
use std::env;
use tauri::Manager;
use tracing_subscriber::FmtSubscriber;
use tauri::async_runtime;

use chlaty_core;

pub mod sources;
pub mod models;
pub mod utils;

pub mod commands;
mod test;
pub mod worker;

#[cfg(debug_assertions)]
pub const IS_DEV: bool = true;

#[cfg(not(debug_assertions))]
pub const IS_DEV: bool = false;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().ok();
    if IS_DEV {
        /* Initialize Logger */
        let subscriber = FmtSubscriber::new();
        tracing::subscriber::set_global_default(subscriber).unwrap();
        /* --- */
    }

    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    #[cfg(not(target_os = "android"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_android_fs::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            #[cfg(target_os = "android")]
            app_handle.plugin(tauri_plugin_android_package_install::init())?;
            #[cfg(not(target_os = "android"))]
            app_handle.plugin(tauri_plugin_updater::Builder::new().build())?;

            let appdata_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?;

            env::set_var("HYPERIONBOX_APPDATA", appdata_dir);
            utils::configs::Configs::init()?;

            /* Spawn Worker */
            async_runtime::spawn(async move {
                chlaty_core::init();
                worker::download::new(app_handle.clone()).await
            });
            /* --- */
            return Ok(());
        })
        .invoke_handler(tauri::generate_handler![
            /* Update */
            commands::update::update,
            /* --- */
            
            /* Config */
            commands::configs::get_configs,
            commands::configs::set_configs,
            /* --- */

            /* Dialog */
            commands::dialog::pick_dir::pick_dir,
            /* --- */

            /* Get Methods Content */
            commands::methods::home::home,
            commands::methods::search::search,
            commands::methods::view::view,
            /* --- */

            /* Manage Plugin */
            commands::manage_plugin::get_plugin_list::get_plugin_list,
            commands::manage_plugin::get_plugin_release::get_plugin_release,
            commands::manage_plugin::get_installed_plugin_list::get_installed_plugin_list,
            commands::manage_plugin::install_plugin::install_plugin,
            commands::manage_plugin::remove_plugin::remove_plugin,
            /* --- */

            /* Request Plugin */
            commands::request_plugin::search_in_plugin::search_in_plugin,
            commands::request_plugin::get_episode_list::get_episode_list,
            commands::request_plugin::get_episode_server::get_episode_server,
            commands::request_plugin::get_server::get_server,
            commands::link_plugin::link_plugin,
            /* --- */

            /* Local Manifest */
            commands::local_manifest::get_local_manifest,
            /* --- */

            /* Favorite */
            commands::favorite::create_tag,
            commands::favorite::get_all_tag,
            commands::favorite::rename_tag,
            commands::favorite::remove_tag,
            commands::favorite::add_favorite,
            commands::favorite::get_tag_from_favorite,
            commands::favorite::get_item_from_favorite,
            commands::favorite::remove_favorite,
            /* --- */

            /* Watch State */
            commands::watch_state::get_watch_state,
            commands::watch_state::save_watch_state,
            /* --- */

            /* Download */
            commands::download::is_available_download,
            commands::download::add_download,
            commands::download::get_download,
            commands::download::set_pause_download,
            commands::download::set_error_download,
            commands::download::remove_download,
            commands::download::remove_download_item,
            commands::download::get_current_download_status,
            commands::download::get_local_download_manifest,
            /* --- */

            /* Settings */
            commands::manage_storage::get_storage_size,
            commands::manage_storage::clean_storage,
            /* --- */
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
