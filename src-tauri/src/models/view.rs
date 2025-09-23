use serde::{Deserialize, Serialize};


use chlaty_core::request_plugin::get_episode_list::DataResult;

use crate::models::local_manifest::LinkPlugin;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trailer {
    pub url: String,
    pub embed_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ViewData {
    pub id: String,
    pub title: String,
    pub poster: String,
    pub banner: String,
    pub description: String,

    pub meta_data: Vec<String>,
    pub trailer: Trailer,

    // Required: Season -> Episodes Page -> Episodes
    pub episode_list: Option<Vec<Vec<Vec<DataResult>>>>,
    pub link_plugin: Option<LinkPlugin>,
}
