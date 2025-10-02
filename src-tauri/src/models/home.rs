use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trailer {
    pub url: String,
    pub embed_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RelevantContent {
    pub id: String,
    pub title: String,
    pub banner: String,
    pub poster: String,
    pub trailer: Trailer,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContentData {
    pub id: String,
    pub title: String,
    pub poster: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Content {
    pub label: String,
    pub data: Vec<ContentData>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HomeData {
    pub relevant_content: Vec<RelevantContent>,
    pub content: Vec<Content>,
}
