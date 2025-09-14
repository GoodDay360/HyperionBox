use std::collections::HashMap;
use tokio;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::anime::models::{
    ApiResponse, Images, Trailer
};



#[derive(Debug, Serialize, Deserialize)]
pub struct Content {
    pub id: usize,
    pub title: String,
    pub images: Images,
    pub trailer: Trailer,
}

async fn get_relevant_content() -> Result<Vec<Content>, Box<dyn std::error::Error>> {
    let clinet = Client::new();
    let url = "https://api.jikan.moe/v4/seasons/now";
    let res = clinet.get(url)
        .send().await?;
    if res.status().is_success() {
        let result = res.json::<ApiResponse>().await?;
        let mut new_relevant_content: Vec<Content> = vec![];
        for item in result.data.ok_or("no data")?.iter() {
            let id = item.mal_id.as_ref().ok_or("no id")?;
            let title = item.title.as_ref().ok_or("no title")?;
            let images = item.images.as_ref().ok_or("no images")?;
            let trailer = item.trailer.as_ref().ok_or("no trailer")?;
            let relevant_content = Content {
                id: id.clone(),
                title: title.clone(),
                images: images.clone(),
                trailer: trailer.clone(),
            };
            new_relevant_content.push(relevant_content);
        }
        return Ok(new_relevant_content);
    }else{
        return Err("error request season_now".into());
    }
    
}


async fn get_content() -> Result<Vec<Content>, Box<dyn std::error::Error>> {
    let clinet = Client::new();
    let url = "https://api.jikan.moe/v4/anime";
    let res = clinet.get(url)
        .send().await?;
    if res.status().is_success() {
        let result = res.json::<ApiResponse>().await?;
        let mut new_content_data: Vec<Content> = vec![];
        for item in result.data.ok_or("no data")?.iter() {
            let id = item.mal_id.as_ref().ok_or("no id")?;
            let title = item.title.as_ref().ok_or("no title")?;
            let images = item.images.as_ref().ok_or("no images")?;
            let trailer = item.trailer.as_ref().ok_or("no trailer")?;
            let new_content = Content {
                id: id.clone(),
                title: title.clone(),
                images: images.clone(),
                trailer: trailer.clone(),
            };
            new_content_data.push(new_content);
        }
        return Ok(new_content_data);
    }else{
        return Err("error request season_now".into());
    }
    
}



pub async fn new() -> Result<HashMap<String, Vec<Content>>, Box<dyn std::error::Error>> {

    let (task_get_relevant_content,
        task_get_content
    ) = tokio::join!(
        get_relevant_content(), 
        get_content()
    );

    
    let relevant_content =  task_get_relevant_content?;
    let contnet = task_get_content?;

    let mut data: HashMap<String, Vec<Content>> = HashMap::new();

    data.insert("relevant_content".to_string(), relevant_content);
    data.insert("content".to_string(), contnet);

    return Ok(data);
    
}