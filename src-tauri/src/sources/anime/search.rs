use reqwest::Client;
use std::time::Duration;
use urlencoding::encode;

use crate::sources::anime::models::ApiResponse;
use crate::models::search::{SearchData};

const LIMIT: usize = 20;

async fn get_content(page: usize, search: &str) -> Result<Vec<SearchData>, String> {
    let clinet = Client::new();
    let url = format!(
        "https://kitsu.io/api/edge/anime?page[limit]={}&page[offset]={}&filter[text]={}",
        LIMIT,
        page * LIMIT,
        encode(&search),
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
        let mut new_search_data: Vec<SearchData> = vec![];
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

            let new_data = SearchData {
                id: id.to_string().clone(),
                title: if title_en.is_some() {
                    title_en.unwrap().clone()
                } else {
                    title.clone()
                },
                poster: poster.clone(),
            };
            new_search_data.push(new_data);
        }

        return Ok(new_search_data);
    } else {
        return Err("error request search".into());
    }
}

pub async fn new(page: usize, search: &str) -> Result<Vec<SearchData>, String> {
    let get_content_result = get_content(page, search).await?;

    return Ok(get_content_result);
}
