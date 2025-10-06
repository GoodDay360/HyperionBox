#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ApiResponse {
    pub data: Option<Vec<Data>>,
    pub meta: Option<Meta>,
    pub links: Option<PageLinks>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Meta {
    pub count: Option<isize>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PageLinks {
    pub first: Option<String>,
    pub last: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Data {
    pub id: Option<String>,
    #[serde(rename = "type")]
    pub _type: Option<String>,
    pub links: Option<Links>,
    pub attributes: Option<Attributes>,
    pub relationships: Option<Relationships>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Links {
    #[serde(rename = "self")]
    pub self_: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Attributes {
    pub createdAt: Option<String>,
    pub updatedAt: Option<String>,
    pub slug: Option<String>,
    pub synopsis: Option<String>,
    pub description: Option<String>,
    pub coverImageTopOffset: Option<isize>,
    pub titles: Option<Titles>,
    pub canonicalTitle: Option<String>,
    pub abbreviatedTitles: Option<Vec<String>>,
    pub averageRating: Option<String>,
    pub ratingFrequencies: Option<std::collections::HashMap<String, String>>,
    pub userCount: Option<isize>,
    pub favoritesCount: Option<isize>,
    pub startDate: Option<String>,
    pub endDate: Option<String>,
    pub nextRelease: Option<String>,
    pub popularityRank: Option<isize>,
    pub ratingRank: Option<isize>,
    pub ageRating: Option<String>,
    pub ageRatingGuide: Option<String>,
    pub subtype: Option<String>,
    pub status: Option<String>,
    pub tba: Option<String>,
    pub posterImage: Option<PosterImage>,
    pub coverImage: Option<CoverImage>,
    pub episodeCount: Option<isize>,
    pub episodeLength: Option<isize>,
    pub totalLength: Option<isize>,
    pub youtubeVideoId: Option<String>,
    pub showType: Option<String>,
    pub nsfw: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Titles {
    pub en: Option<String>,
    pub en_jp: Option<String>,
    pub ja_jp: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PosterImage {
    pub tiny: Option<String>,
    pub large: Option<String>,
    pub small: Option<String>,
    pub medium: Option<String>,
    pub original: Option<String>,
    pub meta: Option<PosterMeta>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CoverImage {
    pub tiny: Option<String>,
    pub large: Option<String>,
    pub small: Option<String>,
    pub original: Option<String>,
    pub meta: Option<CoverMeta>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CoverMeta {
    pub dimensions: Option<CoverDimensions>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CoverDimensions {
    pub tiny: Option<Size>,
    pub large: Option<Size>,
    pub small: Option<Size>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PosterMeta {
    pub dimensions: Option<Dimensions>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Dimensions {
    pub tiny: Option<Size>,
    pub large: Option<Size>,
    pub small: Option<Size>,
    pub medium: Option<Size>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Size {
    pub width: Option<isize>,
    pub height: Option<isize>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Relationships {
    pub genres: Option<RelationshipLinks>,
    pub categories: Option<RelationshipLinks>,
    pub castings: Option<RelationshipLinks>,
    pub installments: Option<RelationshipLinks>,
    pub mappings: Option<RelationshipLinks>,
    pub reviews: Option<RelationshipLinks>,
    pub mediaRelationships: Option<RelationshipLinks>,
    pub characters: Option<RelationshipLinks>,
    pub staff: Option<RelationshipLinks>,
    pub productions: Option<RelationshipLinks>,
    pub quotes: Option<RelationshipLinks>,
    pub episodes: Option<RelationshipLinks>,
    pub streamingLinks: Option<RelationshipLinks>,
    pub animeProductions: Option<RelationshipLinks>,
    pub animeCharacters: Option<RelationshipLinks>,
    pub animeStaff: Option<RelationshipLinks>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RelationshipLinks {
    pub links: Option<RelatedLinks>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct RelatedLinks {
    #[serde(rename = "self")]
    pub self_: Option<String>,
    pub related: Option<String>,
}
