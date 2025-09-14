use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TrailerContent {
    pub embed_url: String,
    pub banner: String,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct RelevantContent {
    pub id: String,
    pub title: String,
    pub cover: String,
    pub trailer: TrailerContent,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Content {
    pub id: String,
    pub title: String,
    pub cover: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HomeData {
    pub relevant_content: Vec<RelevantContent>,
    pub content: Vec<Content>,
}