use tracing::{error, info};

use dotenv::dotenv;
use tracing::Level;
use tracing_subscriber::fmt;

pub mod anime;
pub mod commands;
pub mod models;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().ok();
    fmt()
        .with_max_level(Level::DEBUG)
        .with_thread_names(true)
        .with_thread_ids(true)
        .with_target(true)
        .with_file(true)
        .with_line_number(true)
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![commands::home])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use crate::commands;
    use tauri::async_runtime;

    #[tokio::test]
    async fn home() {
        match commands::home("anime".to_string()).await {
            Ok(d) => {
                println!("Data: {:?}", d)
            }
            Err(_) => assert!(false),
        }
    }
}
