use reqwest::Client;
use visdom::Vis;
use html_escape::decode_html_entities;
use tokio::join;


use crate::models::home::{HomeData, Content, ContentData};

pub async fn get_content(url: &str) -> Result<Vec<ContentData>, String> {
    
    let client = Client::new();

    let res = client.get(url)
        .send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let html = res.text().await.map_err(|e| e.to_string())?;
        let vis = Vis::load(html).map_err(|e| e.to_string())?;
        let card_nodes = vis.find(".card:not(.spacer)");
        let mut new_content_data: Vec<ContentData> = vec![];

        for card in card_nodes {
            let card_node = Vis::load(card.html()).map_err(|e| e.to_string())?;
            
            let h2_a_node = card_node.find(".content").find("h2").find("a");

            let raw_title = h2_a_node.attr("title").ok_or("no title")?.to_string();
            let title = decode_html_entities(&raw_title).to_string();

            let href = h2_a_node.attr("href").ok_or("no href")?.to_string();
            let splited_href = href.split("/").collect::<Vec<&str>>();
            let id_type = splited_href[1].to_string();
            

            let raw_id = splited_href.last().ok_or("no raw id")?.to_string();
            let format_id = raw_id.split("-").collect::<Vec<&str>>().first().ok_or("no id")?.to_string();

            let id = format!("{}-{}", id_type, format_id);

            let a_node = card_node.find(".picture").find("a");

            let img_node = a_node.find("img");
            let mut poster = "".to_string();
            if let Some(img_src) = img_node.attr("src"){
                let img_src = img_src.to_string();
                let splited_img_src = img_src.split("/").collect::<Vec<&str>>();
                let img_id = splited_img_src.last().unwrap_or(&"").to_string();
                poster = format!("https://media.themoviedb.org/t/p/w440_and_h660_face/{}", img_id);
            }

            new_content_data.push(ContentData {
                id,
                title,
                poster
            });
        };
        return Ok(new_content_data);
    }


    return Err("[movie:home:get_trending_content] Failed to get content data.".to_string());
}


pub async fn new() -> Result<HomeData, String> {

    let trending_url = "https://www.themoviedb.org/remote/panel?panel=trending_scroller&group=this-week";
    let popular_url = "https://www.themoviedb.org/remote/panel?panel=popular_scroller&group=in-theatres";

    let (
        task_get_trending_content, task_get_popular_content
    ) = join!(
        get_content(trending_url), get_content(popular_url)
    );

    let mut new_content:Vec<Content> = vec![];

    new_content.push(Content {
        label: "Trending".to_string(),
        data: task_get_trending_content?,
    });

    new_content.push(Content {
        label: "Popular".to_string(),
        data: task_get_popular_content?,
    });

    let home_data: HomeData = HomeData {
        relevant_content: vec![],
        content: new_content,
    };

    return Ok(home_data);

}