use tracing::{info, error};

use tracing_subscriber::fmt;
use tracing::Level;
use dotenv::dotenv;

pub mod commands;
pub mod anime;



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().ok();
    fmt()
        .with_max_level(Level::TRACE)
        .with_thread_names(true)
        .with_thread_ids(true)  
        .with_target(true)  
        .with_file(true)  
        .with_line_number(true) 
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::home
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


#[cfg(test)]
mod tests {
    use crate::{commands};

    #[test]
    fn home() {
        match commands::home("anime".to_string()) {
            Ok(d) => {
                println!("Data: {:?}", d)
            },
            Err(_) => assert!(false),
        }
    }
}