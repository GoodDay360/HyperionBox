use chrono::Utc;

use crate::commands::favorite::{update_timestamp_favorite, get_tag_from_favorite};
use crate::commands::hypersync::favorite::{
    add_favorite_cache
};
use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};

#[tauri::command]
pub async fn update_watch_index(
    source: String,
    id: String,
    season_index: usize,
    episode_index: usize
) -> Result<(), String> {

    /* Update Current Watch Season & Episode */
    
    let mut local_manifest = get_local_manifest(source.clone(), id.clone()).await?;
    local_manifest.current_watch_season_index = Some(season_index);
    local_manifest.current_watch_episode_index = Some(episode_index);
    save_local_manifest(source.clone(), id.clone(), local_manifest).await?;
    let current_timestamp = Utc::now().timestamp_millis() as usize;
    update_timestamp_favorite(source.clone(), id.clone(), current_timestamp).await?;

    let tags = get_tag_from_favorite(source.clone(), id.clone()).await?;
    if tags.len() > 0 {
        add_favorite_cache(source, id).await?;
    }
    
    /* --- */

    return Ok(());
}