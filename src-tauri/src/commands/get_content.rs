use crate::anime;

use crate::models::home::HomeData;
#[tauri::command]
pub async fn home(source: String) -> Result<HomeData, String> {
    if source == "anime" {
        match anime::home::new().await {
            Ok(data) => return Ok(data),
            Err(e) => {
                println!("Error: {}", e);
                return Err(e);
            }
        }
    }
    return Err("Unkown Source".to_string());
}

use crate::models::search::SearchData;
#[tauri::command]
pub async fn search(source: String, page: usize, search: String) -> Result<SearchData, String> {
    if source == "anime" {
        match anime::search::new(page, search).await {
            Ok(data) => return Ok(data),
            Err(e) => {
                println!("Error: {}", e);
                return Err(e);
            }
        }
    }
    return Err("Unkown Source".to_string());
}

use crate::models::view::ViewData;
#[tauri::command]
pub async fn view(source: String, id: String) -> Result<ViewData, String> {
    if source == "anime" {
        match anime::view::new(id).await {
            Ok(data) => return Ok(data),
            Err(e) => {
                println!("Error: {}", e);
                return Err(e);
            }
        }
    }
    return Err("Unkown Source".to_string());
}
