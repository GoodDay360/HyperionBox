use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiResponse {
    pub pagination: Option<Pagination>,
    pub data: Option<Vec<Data>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Pagination {
    pub last_visible_page: Option<usize>,
    pub has_next_page: Option<bool>,
    pub current_page: Option<usize>,
    pub items: Option<PaginationItems>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaginationItems {
    pub count: Option<usize>,
    pub total: Option<usize>,
    pub per_page: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Data {
    pub mal_id: Option<usize>,
    pub url: Option<String>,
    pub images: Option<Images>,
    pub trailer: Option<Trailer>,
    pub approved: Option<bool>,
    pub titles: Option<Vec<Title>>,
    pub title: Option<String>,
    pub title_english: Option<String>,
    pub title_japanese: Option<String>,
    pub title_synonyms: Option<Vec<String>>,
    pub type_: Option<String>,
    pub source: Option<String>,
    pub episodes: Option<usize>,
    pub status: Option<String>,
    pub airing: Option<bool>,
    pub aired: Option<Aired>,
    pub duration: Option<String>,
    pub rating: Option<String>,
    pub score: Option<f32>,
    pub scored_by: Option<usize>,
    pub rank: Option<usize>,
    pub popularity: Option<usize>,
    pub members: Option<usize>,
    pub favorites: Option<usize>,
    pub synopsis: Option<String>,
    pub background: Option<String>,
    pub season: Option<String>,
    pub year: Option<usize>,
    pub broadcast: Option<Broadcast>,
    pub producers: Option<Vec<Entity>>,
    pub licensors: Option<Vec<Entity>>,
    pub studios: Option<Vec<Entity>>,
    pub genres: Option<Vec<Entity>>,
    pub explicit_genres: Option<Vec<Entity>>,
    pub themes: Option<Vec<Entity>>,
    pub demographics: Option<Vec<Entity>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Images {
    pub jpg: Option<ImageFormat>,
    pub webp: Option<ImageFormat>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageFormat {
    pub image_url: Option<String>,
    pub small_image_url: Option<String>,
    pub large_image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trailer {
    pub youtube_id: Option<String>,
    pub url: Option<String>,
    pub embed_url: Option<String>,
    pub images: Option<TrailerImages>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrailerImages {
    pub image_url: Option<String>,
    pub small_image_url: Option<String>,
    pub medium_image_url: Option<String>,
    pub large_image_url: Option<String>,
    pub maximum_image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Title {
    pub type_: Option<String>,
    pub title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Aired {
    pub from: Option<String>,
    pub to: Option<String>,
    pub prop: Option<AiredProp>,
    pub string: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AiredProp {
    pub from: Option<DateParts>,
    pub to: Option<DateParts>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DateParts {
    pub day: Option<usize>,
    pub month: Option<usize>,
    pub year: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Broadcast {
    pub day: Option<String>,
    pub time: Option<String>,
    pub timezone: Option<String>,
    pub string: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Entity {
    pub mal_id: Option<usize>,
    pub type_: Option<String>,
    pub name: Option<String>,
    pub url: Option<String>,
}
