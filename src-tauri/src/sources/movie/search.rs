use reqwest::Client;
use visdom::Vis;
use html_escape::decode_html_entities;
use urlencoding::encode;

use crate::models::search::SearchData;

async fn get_content(page: usize, search: &str) -> Result<Vec<SearchData>, String> {
    

    let url = format!("https://www.themoviedb.org/search/movie?query={}&page={}", encode(search), page);
    let client = Client::new();
    let res = client.get(url)
        .send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let mut new_search_data: Vec<SearchData> = vec![];
        let html = res.text().await.map_err(|e| e.to_string())?;
        let vis = Vis::load(html).map_err(|e| e.to_string())?;
        let movie_result_nodes = vis.find(".search_results.movie").find(".results").find(".card");
        let tv_result_nodes = vis.find(".search_results.tv").find(".results").find(".card");
        let node_result_to_check = [movie_result_nodes, tv_result_nodes];

        for node_to_check in node_result_to_check{
            for node_result in node_to_check {
                let node = Vis::load(node_result.html()).map_err(|e| e.to_string())?;
                let img_node = node.find(".picture").find("img");
                let mut poster = "".to_string();
                if let Some(img_src) = img_node.attr("src"){
                    let img_src = img_src.to_string();
                    let splited_img_src = img_src.split("/").collect::<Vec<&str>>();
                    let img_id = splited_img_src.last().unwrap_or(&"").to_string();
                    poster = format!("https://media.themoviedb.org/t/p/w600_and_h900_face/{}", img_id);
                }
                
                let a_details_node = node.find(".details").find("a");

                let id_type = a_details_node.attr("data-media-type").ok_or("no id type")?.to_string();
                let href = a_details_node.attr("href").ok_or("no href")?.to_string();
                let splited_href = href.split("/").collect::<Vec<&str>>();
                let raw_id = splited_href.last().ok_or("no id")?.to_string();
                let splited_raw_id = raw_id.split("-").collect::<Vec<&str>>();
                let format_id = splited_raw_id.first().ok_or("no id")?.to_string();

                let id = format!("{}-{}", id_type, format_id);
                

                let h2_node = a_details_node.find("h2");
                let title = decode_html_entities(&h2_node.text()).to_string();
                
                let new_data = SearchData { id, title, poster };
                new_search_data.push(new_data);
                
            }

        }
        return Ok(new_search_data);
    }

    return Err("[movie:search:get_content] Failed to get content data.".to_string());
}

pub async fn new(page: usize, search: &str) -> Result<Vec<SearchData>, String> {

    return Ok(get_content(page, search).await?);
    
}
