use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Content {
    pub id: String,
    pub title: String,
    pub poster: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchData {
    pub data: Vec<Content>,
    pub max_page: usize,
}
