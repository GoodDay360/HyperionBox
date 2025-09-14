use tauri::async_runtime;
use tokio;
use crate::anime;
use crate::models::home::HomeData;
use crate::models::Error;
use anyhow;
use std::future::Future;
use futures::future::{BoxFuture, FutureExt};


#[tauri::command]
pub async fn home(source: String) -> Result<(), Error> {
    if source == "anime" {
        anime::home::new().await?;
    }
    return Ok(());
}