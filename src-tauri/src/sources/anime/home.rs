use reqwest::Client;
use std::time::Duration;
use tokio;
use tracing::error;
use chrono::Utc;

use crate::sources::anime::models::ApiResponse;
use crate::models::home::{Content, ContentData, HomeData, RelevantContent, Trailer};
use crate::utils::get_calendar;

async fn get_relevant_content(source:&str) -> Result<Vec<RelevantContent>, String> {
    let clinet = Client::new();
    let calendar = get_calendar::new().map_err(|e| e.to_string())?;
    let url = format!(
        "https://kitsu.io/api/edge/anime?page[limit]=20&filter[season]={}&filter[seasonYear]={}",
        calendar.anime_season, calendar.year
    );

    let res = clinet
        .get(url)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if res.status().is_success() {
        // # Missing Key Debug
        // let result_text = res.text().await.map_err(|e| e.to_string())?;
        // let result = from_str::<ApiResponse>(&result_text).map_err(|e| e.to_string())?;
        // println!("result: {:?}", result);
        // #========================================

        let result = res.json::<ApiResponse>().await.map_err(|e| e.to_string())?;

        let mut new_relevant_content: Vec<RelevantContent> = vec![];
        for item in result.data.ok_or("no data")?.iter() {
            let id = item.id.as_ref().ok_or("no id")?;
            let atributes = item.attributes.as_ref().ok_or("no attributes")?;
            let title_en = atributes.titles.as_ref().ok_or("no title")?.en.as_ref();
            let title = atributes.canonicalTitle.as_ref().ok_or("no title")?;
            let mut poster: String = "".to_string();
            if let Some(poster_image) = atributes.posterImage.as_ref() {
                poster = poster_image
                    .large
                    .as_ref()
                    .unwrap_or(&"".to_string())
                    .clone();
                if poster.is_empty() {
                    poster = poster_image
                        .original
                        .as_ref()
                        .unwrap_or(&"".to_string())
                        .clone();
                }
            }

            let mut banner: String = String::new();

            if let Some(cover) = atributes.coverImage.as_ref() {
                if let Some(large) = cover.large.as_ref() {
                    banner = large.to_string();
                }
            }
            let mut trailer_url = String::new();
            let mut trailer_embed_url = String::new();
            if let Some(youtube_id) = atributes.youtubeVideoId.as_ref() {
                trailer_url = format!("https://www.youtube.com/watch?v={}", youtube_id);
                trailer_embed_url = format!("https://www.youtube.com/embed/{}", youtube_id);

                if banner.is_empty() {
                    banner = format!(
                        "https://img.youtube.com/vi/{}/maxresdefault.jpg",
                        youtube_id
                    );
                }
            } else if banner.is_empty() {
                banner = poster.clone();
            }

            let relevant_content = RelevantContent {
                source: source.to_string(),
                id: id.to_string().clone(),
                title: if title_en.is_some() {
                    title_en.unwrap().clone()
                } else {
                    title.clone()
                },
                poster: poster.clone(),
                banner: banner.clone(),
                trailer: Trailer {
                    embed_url: trailer_embed_url.clone(),
                    url: trailer_url.clone(),
                },
            };
            new_relevant_content.push(relevant_content);
        }
        return Ok(new_relevant_content);
    } else {
        return Err("error request season_now".into());
    }
}

async fn get_trending_content(source:&str) -> Result<Vec<ContentData>, String> {
    let clinet = Client::new();
    let url = format!("https://kitsu.io/api/edge/trending/anime",);
    let res = clinet
        .get(url)
        .timeout(Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if res.status().is_success() {
        let result = res.json::<ApiResponse>().await.map_err(|e| e.to_string())?;
        let mut new_content_data: Vec<ContentData> = vec![];
        for item in result.data.ok_or("no data")?.iter() {
            let id = item.id.as_ref().ok_or("no id")?;
            let atributes = item.attributes.as_ref().ok_or("no attributes")?;
            let title_en = atributes.titles.as_ref().ok_or("no title")?.en.as_ref();
            let title = atributes.canonicalTitle.as_ref().ok_or("no title")?;
            let mut poster: String = "".to_string();
            if let Some(poster_image) = atributes.posterImage.as_ref() {
                poster = poster_image
                    .large
                    .as_ref()
                    .unwrap_or(&"".to_string())
                    .clone();
                if poster.is_empty() {
                    poster = poster_image
                        .original
                        .as_ref()
                        .unwrap_or(&"".to_string())
                        .clone();
                }
            }

            let new_content_item = ContentData {
                source: source.to_string(),
                id: id.to_string().clone(),
                title: if title_en.is_some() {
                    title_en.unwrap().clone()
                } else {
                    title.clone()
                },
                poster: poster,
            };
            new_content_data.push(new_content_item);
        }
        return Ok(new_content_data);
    } else {
        return Err("error request season_now".into());
    }
}

pub async fn new(source:&str) -> Result<HomeData, String> {
    let (task_get_relevant_content, task_get_trending_content) =
        tokio::join!(get_relevant_content(&source), get_trending_content(&source),);

    let relevant_content = match task_get_relevant_content {
        Ok(content) => content,
        Err(e) => {
            error!("get_relevant_content error: {}", e);
            vec![]
        }
    };

    let mut new_content: Vec<Content> = vec![];

    match task_get_trending_content {
        Ok(data) => {
            if data.len() > 0 {
                new_content.push(Content {
                    label: "Trending Anime".to_string(),
                    data: data,
                });
            }
        }
        Err(_) => {
            error!("get_trending_content error")
        }
    };

    let current_timestamp: usize = Utc::now().timestamp_millis() as usize;

    return Ok(HomeData {
        relevant_content: relevant_content,
        content: new_content,
        last_save_timestamp: current_timestamp,
    });
}
