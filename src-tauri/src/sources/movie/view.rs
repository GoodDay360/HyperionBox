use reqwest::Client;
use visdom::Vis;
use html_escape::decode_html_entities;

use crate::models::view::{ManifestData, Trailer};

async fn get_content(id_type: &str, id: &str) -> Result<ManifestData, String> {
    
    let raw_id = format!("{}-{}", &id_type, &id);


    let url = format!("https://www.themoviedb.org/{}/{}", id_type, id);

    let client = Client::new();
    let res = client.get(url)
        .send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {

        let html = res.text().await.map_err(|e| e.to_string())?;
        let vis = Vis::load(html).map_err(|e| e.to_string())?;
        
        let a_title_node = vis.find(".title").find("h2").find("a");
        let title = decode_html_entities(&a_title_node.text()).to_string();

        let p_overview = vis.find(".overview").find("p");
        let description = decode_html_entities(&p_overview.text()).to_string();

        
        let img_node = vis.find(".poster").find(".image_content").find("img");
        
        let mut poster = "".to_string();
        if let Some(img_src) = img_node.attr("src"){
            let img_src = img_src.to_string();
            let splited_img_src = img_src.split("/").collect::<Vec<&str>>();
            let img_id = splited_img_src.last().unwrap_or(&"").to_string();
            poster = format!("https://media.themoviedb.org/t/p/w600_and_h900_face/{}", img_id);
        }

        let mut banner = "".to_string();
        let backdrop_img_node = vis.find(".backdrop.picture").find("img");
        if let Some(img_src) = backdrop_img_node.attr("src"){
            let img_src = img_src.to_string();
            let splited_img_src = img_src.split("/").collect::<Vec<&str>>();
            let img_id = splited_img_src.last().unwrap_or(&"").to_string();
            banner = format!("https://media.themoviedb.org/t/p/w1280_and_h720_face/{}", img_id);
        }else if banner.is_empty() {
            banner = poster.clone();
        }

        let mut new_meta_data: Vec<String> = vec![];

        let facts_node = vis.find(".facts");
        let certification_node = facts_node.find(".certification");
        let certification = decode_html_entities(&certification_node.text().trim()).to_string();
        if !certification.is_empty() {
            new_meta_data.push(certification);
        }

        let a_genres_nodes = facts_node.find(".genres").find("a");
        let mut genres_meta:Vec<String> = vec![];
        for genre in a_genres_nodes{
            let genre_node = Vis::load(genre.html()).map_err(|e| e.to_string())?;
            let genre_text = decode_html_entities(&genre_node.text().trim()).to_string();
            genres_meta.push(genre_text);
        }
        new_meta_data.push(genres_meta.join(", "));
        

        let mut trailer_url: String = "".to_string();
        let mut trailed_embed_url: String = "".to_string();

        let trailer_node = vis.find(".video.card").find(".play_trailer");
        if let Some(trailer_site) = trailer_node.attr("data-site") {
            let trailer_site = trailer_site.to_string();
            if trailer_site == "YouTube" {
                if let Some(trailer_id) = trailer_node.attr("data-id") {
                    let trailer_id = trailer_id.to_string();
                    trailer_url = format!("https://www.youtube.com/watch?v={}", trailer_id);
                    trailed_embed_url = format!("https://www.youtube.com/embed/{}", trailer_id);
                }
            }
        }


        let new_manifest_data = ManifestData {
            id: raw_id,
            title,
            description,
            poster,
            banner,
            meta_data: new_meta_data,
            trailer: Some(Trailer {
                url: trailer_url,
                embed_url: trailed_embed_url
            }),
            episode_list: None,
        };

        return Ok(new_manifest_data);

    }

    return Err("[movie:view:get_content] Failed to get content data.".to_string());
}

pub async fn new(raw_id:&str) -> Result<ManifestData, String> {
    let splited_raw_id = raw_id.split("-").collect::<Vec<&str>>();
    let id_type = splited_raw_id.first().ok_or("no id type")?;
    let id = splited_raw_id.last().ok_or("no id")?;

    return Ok(get_content(id_type, id).await?);
    
}
