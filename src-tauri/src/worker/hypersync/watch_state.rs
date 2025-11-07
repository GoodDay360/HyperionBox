use tokio::{time::{sleep, Duration}};
use tracing::{error};
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, AUTHORIZATION};
use serde::{Deserialize, Serialize};
use chrono::Utc;

use crate::commands::hypersync::watch_state::{
    clear_watch_state_cache, get_all_watch_state_cache
};
use crate::utils::configs::Configs;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Payload {
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize,
    current_time: f64,
    timestamp: usize,
}
async fn upload() -> Result<(), String> {
    let configs_data = Configs::get()?;

    /* Check if token is empty */
    /* Skip upload since not logged in yet. */
    let token: String;
    if let Some(t) = configs_data.hypersync_token {
        if t.is_empty() {
            return Ok(());
        }else{
            token = t;
        }
    } else {
        return Ok(());
    }
    /* --- */

    let hypersync_server = configs_data.hypersync_server.ok_or("HyperSync server is not set yet.")?;

    let watch_state_cache = get_all_watch_state_cache().await?;

    let client = Client::new();

    let current_timestamp = Utc::now().timestamp_millis() as usize;

    for watch_state in watch_state_cache {
        let payload = Payload {
            source: watch_state.source.clone(),
            id: watch_state.id.clone(),
            season_index: watch_state.season_index,
            episode_index: watch_state.episode_index,
            current_time: watch_state.current_time,
            timestamp: watch_state.timestamp,
        };

        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        headers.insert(
            AUTHORIZATION, 
            HeaderValue::from_str(&token)
                .map_err(|e|e.to_string())?
        );

        let url = format!("{}/api/user/watch_state/add", hypersync_server);

        let response = client
            .post(url)
            .headers(headers)
            .json(&payload)
            .timeout(Duration::from_secs(30))
            .send()
            .await.map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(response.status().to_string());
        }

        clear_watch_state_cache(watch_state.source, watch_state.id, watch_state.season_index, watch_state.episode_index, current_timestamp).await?;
    }


    Ok(())
}


pub async fn new(){
    loop {
        match upload().await {
            Ok(()) => {
                // info!("[Worker:HyperSync:WatchState]: All tasks completed successfully.");
            }
            Err(e) => {
                error!("[Worker:HyperSync:WatchState]: {}", e);
                sleep(Duration::from_secs(10)).await;
            },
        }
        sleep(Duration::from_secs(5)).await;
    }
}