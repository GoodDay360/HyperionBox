use tauri::async_runtime;
use tokio;
use crate::anime;
use crate::models::home::HomeData;
use anyhow;
use std::future::Future;
use futures::future::{BoxFuture, FutureExt};


#[tauri::command]
pub async fn home(source: String) -> Result<HomeData, String>  {
    if source == "anime" {
        
        let result = anime::home::new().await.map_err(|e| e.to_string())?;

        return Ok(result);

    }
    return Err("error".to_string());
}