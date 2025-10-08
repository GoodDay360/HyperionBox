use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchData {
    pub id: String,
    pub title: String,
    pub poster: String,
}
