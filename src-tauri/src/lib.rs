use std::env;
use dotenv::dotenv;
use tracing::Level;
use tracing_subscriber::fmt;
use tauri::Manager;


pub mod models;
pub mod utils;
pub mod anime;


pub mod commands;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().ok();
    
    fmt()
        .with_max_level(Level::INFO)
        .with_thread_names(true)
        .with_thread_ids(true)
        .with_target(true)
        .with_file(true)
        .with_line_number(true)
        .init();

    

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let appdata_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
            
            env::set_var("HYPERIONBOX_APPDATA", appdata_dir);

            utils::configs::init()?;
            return Ok(());
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            /* Config */
            commands::configs::get_configs,
            commands::configs::set_configs,
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
            /* === */

            commands::link_plugin::link_plugin,
            
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}

#[cfg(test)]
mod tests {
    use crate::commands;
    use crate::utils;
    use tauri::async_runtime;

    #[tokio::test]
    async fn init() {
        utils::configs::init().map_err(|e| e.to_string()).unwrap();
    }

    #[tokio::test]
    async fn test() {
        match commands::get_content::view("anime".to_string(), "1".to_string()).await {
            Ok(d) => {
                println!("Data: {:?}", d)
            }
            Err(_) => assert!(false),
        }
    }


    use crate::utils::configs;

    #[tokio::test]
    async fn test_setting() {
        let _ = configs::get();
    }
}
