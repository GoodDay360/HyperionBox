use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Download {
    pub source: String,
    pub id: String,
    pub plugin_id: String,
    pub pause: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadItem {
    pub source: String,
    pub id: String,
    pub season_index: usize,
    pub episode_index: usize,
    pub episode_id: String,
    pub prefer_server_type: String,
    pub prefer_server_index: usize,
    pub prefer_quality: usize,
    pub error: usize,
    pub done: usize,
}

/* GetDownload */
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Episode {
    pub error: bool,
    pub done: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetDownload {
    pub source: String,
    pub id: String,
    pub title: String,
    pub poster: String,
    pub seasons: HashMap<usize, HashMap<usize, Episode>>, // Season Index -> HshMap<Episode Index, Episode>
    pub pause: bool,
    pub max: usize,
    pub finished: usize,
}
/* --- */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadStatusManifest {
    pub current: isize,
}

impl DownloadStatusManifest {
    pub fn default() -> Self {
        DownloadStatusManifest { current: -1 }
    }
}
