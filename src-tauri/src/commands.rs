use crate::anime;
use crate::models::home::HomeData;
use crate::models::search::SearchData;

use futures::future::{BoxFuture, FutureExt};
use std::future::Future;
use tauri::async_runtime;
use tokio;
use tracing::error;

#[tauri::command]
pub async fn home(source: String) -> Result<HomeData, String> {
    if source == "anime" {
        match anime::home::new().await {
            Ok(data) => return Ok(data),
            Err(e) => {
                println!("Error: {}", e);
                return Err(e);
            }
        }
    }
    return Err("Unkown Source".to_string());
}

#[tauri::command]
pub async fn search(source: String, page: usize, search: String) -> Result<SearchData, String> {
    if source == "anime" {
        match anime::search::new(page, search).await {
            Ok(data) => return Ok(data),
            Err(e) => {
                println!("Error: {}", e);
                return Err(e);
            }
        }
    }
    return Err("Unkown Source".to_string());
}
