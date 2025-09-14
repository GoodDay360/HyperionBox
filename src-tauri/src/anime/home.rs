use std::collections::HashMap;
use std::ffi::CString;
use tokio;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::models::home::{
    Content, RelevantContent, TrailerContent, HomeData
};

use crate::anime::models::{
    ApiResponse
};


async fn get_relevant_content() -> Result<Vec<RelevantContent>, String> {
    let clinet = Client::new();
    let url = "https://api.jikan.moe/v4/seasons/now";
    let res = clinet.get(url)
        .send().await.map_err(|e| e.to_string())?;
    if res.status().is_success() {
        let result = res.json::<ApiResponse>().await.map_err(|e| e.to_string())?;
        let mut new_relevant_content: Vec<RelevantContent> = vec![];
        for item in result.data.ok_or("no data")?.iter() {
            let id = item.mal_id.as_ref().ok_or("no id")?;
            let title = item.title.as_ref().ok_or("no title")?;
            let cover = item.images.as_ref().ok_or("no images")?
                .webp.as_ref().ok_or("no webp")?
                .large_image_url.as_ref().ok_or("no image_url")?;
            let trailer = item.trailer.as_ref().ok_or("no trailer")?;
            let trailer_embed_url = trailer.embed_url.as_ref().ok_or("no embed_url")?;
            let trailer_banner = trailer.images.as_ref().ok_or("no images")?
                .maximum_image_url.as_ref().ok_or("no maximum_image_url")?;

            let relevant_content = RelevantContent {
                id: id.to_string().clone(),
                title: title.clone(),
                cover: cover.clone(),
                trailer: TrailerContent {
                    embed_url: trailer_embed_url.clone(),
                    banner: trailer_banner.clone(),
                },
            };
            new_relevant_content.push(relevant_content);
        }
        return Ok(new_relevant_content);
    }else{
        return Err("error request season_now".into());
    }
    
}




async fn get_content() -> Result<Vec<Content>, String> {
    let clinet = Client::new();
    let url = "https://api.jikan.moe/v4/anime";
    let res = clinet.get(url)
        .send().await.map_err(|e| e.to_string())?;
    if res.status().is_success() {
        let result = res.json::<ApiResponse>().await.map_err(|e| e.to_string())?;
        let mut new_content_data: Vec<Content> = vec![];
        for item in result.data.ok_or("no data")?.iter() {
            let id = item.mal_id.as_ref().ok_or("no id")?;
            let title = item.title.as_ref().ok_or("no title")?;
            let cover = item.images.as_ref().ok_or("no images")?
                .webp.as_ref().ok_or("no webp")?
                .large_image_url.as_ref().ok_or("no image_url")?;
            let new_content = Content {
                id: id.to_string().clone(),
                title: title.clone(),
                cover: cover.clone()
            };
            new_content_data.push(new_content);
        }
        return Ok(new_content_data);
    }else{
        return Err("error request season_now".into());
    }
    
}




pub async fn new() -> Result<HomeData, String> {

    
    let (task_get_relevant_content,
        task_get_content
    ) = tokio::join!(
        get_relevant_content(), 
        get_content()
    );

    let relevant_content = task_get_relevant_content.map_err(|e| e.to_string())?;
    let content = task_get_content.map_err(|e| e.to_string())?;

    return Ok(HomeData {
        relevant_content: relevant_content,
        content: content,
    });
    
}