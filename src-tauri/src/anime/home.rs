use reqwest::Client;
use std::collections::HashMap;
use std::time::Duration;
use tokio;

use crate::anime::models::ApiResponse;
use crate::models::home::{Content, HomeData, RelevantContent, Trailer};
use crate::utils::get_calendar;

async fn get_relevant_content() -> Result<Vec<RelevantContent>, String> {
    let clinet = Client::new();
    let calendar = get_calendar::new().map_err(|e| e.to_string())?;
    let url = format!(
        "https://kitsu.io/api/edge/anime?page[limit]=20&filter[season]={}&filter[seasonYear]={}",
        calendar.anime_season, calendar.year
    );
    println!("URL: {}", url);
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
            let poster = atributes
                .posterImage
                .as_ref()
                .ok_or("no poster")?
                .large
                .as_ref()
                .ok_or("no large poster")?;

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
            }

            let relevant_content = RelevantContent {
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

async fn get_trending_content() -> Result<Vec<Content>, String> {
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
        let mut new_content_data: Vec<Content> = vec![];
        for item in result.data.ok_or("no data")?.iter() {
            let id = item.id.as_ref().ok_or("no id")?;
            let atributes = item.attributes.as_ref().ok_or("no attributes")?;
            let title_en = atributes.titles.as_ref().ok_or("no title")?.en.as_ref();
            let title = atributes.canonicalTitle.as_ref().ok_or("no title")?;
            let poster = atributes
                .posterImage
                .as_ref()
                .ok_or("no poster")?
                .large
                .as_ref()
                .ok_or("no large poster")?;

            let new_content = Content {
                id: id.to_string().clone(),
                title: if title_en.is_some() {
                    title_en.unwrap().clone()
                } else {
                    title.clone()
                },
                poster: poster.clone(),
            };
            new_content_data.push(new_content);
        }
        return Ok(new_content_data);
    } else {
        return Err("error request season_now".into());
    }
}

pub async fn new() -> Result<HomeData, String> {
    let (task_get_relevant_content, task_get_trending_content) = tokio::join!(
        get_relevant_content(), get_trending_content()
    );

    let relevant_content = task_get_relevant_content.map_err(|e| e.to_string())?;

    let mut new_content: HashMap<String, Vec<Content>> = HashMap::new();

    let trending_content = task_get_trending_content.map_err(|e| e.to_string())?;

    new_content.insert("Trending Anime".to_string(), trending_content);

    return Ok(HomeData {
        relevant_content: relevant_content,
        content: new_content,
    });
}
