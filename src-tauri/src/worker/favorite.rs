use tokio::{time::{sleep, Duration}};
use tracing::{error, info};

use crate::commands::favorite::get_all_hypersync_cache;

async fn upload() -> Result<(), String> {
    let hypersync_cache = get_all_hypersync_cache().await?;
    

    Ok(())
}


pub async fn new(){
    loop {
        
        match upload().await {
            Ok(()) => {
                info!("[Worker:Favorite]: All tasks completed successfully.");
            }
            Err(e) => error!("[Worker:Favorite]: {}", e),
        }
        sleep(Duration::from_secs(5)).await;
    }
}