use reqwest::Client;
use serde_json::{from_value, Value};
use std::time::Duration;
use std::vec;
use urlencoding::encode;

use crate::sources::anime::models::Data;
use crate::models::view::{ManifestData, Trailer};

async fn get_content(id: &str) -> Result<ManifestData, String> {
    let clinet = Client::new();
    let url = format!("https://kitsu.io/api/edge/anime/{}", encode(&id));

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

        let result = res.json::<Value>().await.map_err(|e| e.to_string())?;

        let data = from_value::<Data>(result.get("data").ok_or("no data")?.clone())
            .ok()
            .ok_or("unable to convert data")?;

        let id = data.id.as_ref().ok_or("no id")?;

        let atributes = data.attributes.as_ref().ok_or("no attributes")?;

        let description = atributes.description.as_ref().ok_or("no description")?;
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

        /* Metadata */

        let mut meta_data: Vec<String> = vec![];

        let _type = data._type.as_ref();
        let show_type = atributes.showType.as_ref();
        let episode_count = atributes.episodeCount.as_ref();
        let age_rating = atributes.ageRating.as_ref();
        let status = atributes.status.as_ref();

        if let Some(t) = _type {
            meta_data.push(t.clone());
        }

        if let Some(show) = show_type {
            meta_data.push(show.clone());
        }

        if let Some(episodes) = episode_count {
            meta_data.push(format!("Episodes: {}", episodes));
        }

        if let Some(age) = age_rating {
            meta_data.push(age.clone());
        }

        if let Some(stat) = status {
            meta_data.push(stat.clone());
        }

        /* --- */

        let view_data = ManifestData {
            id: id.to_string().clone(),
            title: if let Some(t) = title_en {
                t.clone()
            } else {
                title.clone()
            },
            poster: poster.clone(),
            banner: banner.clone(),
            trailer: Some(Trailer {
                embed_url: trailer_embed_url.clone(),
                url: trailer_url.clone(),
            }),
            description: description.clone(),
            meta_data,
            episode_list: None,
        };

        return Ok(view_data);
    } else {
        return Err("error request view_data".into());
    }
}

pub async fn new(id: &str) -> Result<ManifestData, String> {
    let get_content_result = get_content(id).await?;

    return Ok(get_content_result);
}
