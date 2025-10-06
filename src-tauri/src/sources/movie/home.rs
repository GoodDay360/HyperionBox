use reqwest::Client;
use visdom::Vis;
use visdom::types::Elements;
use html_escape::decode_html_entities;


use crate::models::home::{HomeData, RelevantContent, Content, ContentData};

pub async fn get_relevant_content(vis_root: Elements<'static>) -> Result<(), String> {
    
    let swiper_wrapper = vis_root.find(".swiper-wrapper");
    let swiper_slide = swiper_wrapper.find(".swiper-slide");
    for slide_dom in swiper_slide {
        let slide_node = Vis::dom(&slide_dom);
        let figure = slide_node.find("figure");

        let poster_div = figure.find(".ipc-poster__poster-image");
        let poster_img = poster_div.find("img");

        let poster_img_src_set = poster_img.attr("srcset").ok_or("no src")?.to_string();
        let poster_img_src_set_split = poster_img_src_set.split(", ").collect::<Vec<&str>>();
        let last_poster_img_src_set = poster_img_src_set_split.last().ok_or("no src")?.to_string();

        let poster: String = last_poster_img_src_set.split(" ").collect::<Vec<&str>>().first().ok_or("no src")?.to_string();

        
        let slate_div = figure.find(".ipc-slate__slate-image");
        let slate_img = slate_div.find("img");

        let slate_img_src_set = slate_img.attr("srcset").ok_or("no src")?.to_string();
        let slate_img_src_set_split = slate_img_src_set.split(", ").collect::<Vec<&str>>();
        let last_slate_img_src_set = slate_img_src_set_split.last().ok_or("no src")?.to_string();

        let banner: String = last_slate_img_src_set.split(" ").collect::<Vec<&str>>().first().ok_or("no src")?.to_string();

        let title = decode_html_entities(&slate_img.attr("alt").ok_or("no title")?.to_string()).to_string();
        println!("banner: {}", banner);
        println!("poster: {}", poster);
        println!("title: {}", title);


    };
    return Ok(());
}


pub async fn new() -> Result<HomeData, String> {
    let client = Client::new();

    let res = client.get("https://www.imdb.com/").send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let html = res.text().await.map_err(|e| e.to_string())?;
        let vis_root = Vis::load(html).map_err(|e| e.to_string())?;
        get_relevant_content(vis_root).await?;
    }else{
        return Err("[home]: Request failed.".to_string());
    }

    return Err("Unkown Source".to_string());
}