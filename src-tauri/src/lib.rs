use dotenv::dotenv;
use std::env;
use tauri::Manager;
use tracing::Level;
use tracing_subscriber::fmt;

pub mod anime;
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
        fmt()
            .with_max_level(Level::INFO)
            .with_max_level(Level::ERROR)
            .with_max_level(Level::WARN)
            .with_thread_names(true)
            .with_thread_ids(true)
            .with_target(true)
            .with_file(true)
            .with_line_number(true)
            .init();
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle();
            let appdata_dir = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?;

            env::set_var("HYPERIONBOX_APPDATA", appdata_dir);
            utils::configs::init()?;

            /* Spawn Worker */
            worker::download::new(app_handle.clone());
            /* --- */
            return Ok(());
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_android_fs::init())
        .invoke_handler(tauri::generate_handler![
            /* Config */
            commands::configs::get_configs,
            commands::configs::set_configs,
            /* === */

            /* Dialog */
            commands::dialog::pick_dir::pick_dir,
            /* === */

            /* Get Content */
            commands::get_content::home,
            commands::get_content::search,
            commands::get_content::view,
            /* === */

            /* Manage Plugin */
            commands::manage_plugin::get_plugin_list::get_plugin_list,
            commands::manage_plugin::get_plugin_release::get_plugin_release,
            commands::manage_plugin::get_installed_plugin_list::get_installed_plugin_list,
            commands::manage_plugin::install_plugin::install_plugin,
            commands::manage_plugin::remove_plugin::remove_plugin,
            /* === */

            /* Request Plugin */
            commands::request_plugin::search_in_plugin::search_in_plugin,
            commands::request_plugin::get_episode_list::get_episode_list,
            commands::request_plugin::get_episode_server::get_episode_server,
            commands::request_plugin::get_server::get_server,
            commands::link_plugin::link_plugin,
            /* === */

            /* Local Manifest */
            commands::local_manifest::get_local_manifest,
            /* === */

            /* Favorite */
            commands::favorite::create_tag,
            commands::favorite::get_all_tag,
            commands::favorite::rename_tag,
            commands::favorite::remove_tag,
            commands::favorite::add_favorite,
            commands::favorite::get_tag_from_favorite,
            commands::favorite::get_item_from_favorite,
            commands::favorite::remove_favorite,
            /* === */

            /* Watch State */
            commands::watch_state::get_watch_state,
            commands::watch_state::save_watch_state,
            /* === */

            /* Download */
            commands::download::add_download,
            commands::download::get_download,
            commands::download::set_pause_download,
            commands::download::set_error_download,
            commands::download::remove_download,
            commands::download::remove_download_item,
            commands::download::get_current_download_status,
            commands::download::get_local_download_manifest,
            /* === */
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
