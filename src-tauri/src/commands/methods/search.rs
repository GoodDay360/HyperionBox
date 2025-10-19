
use tracing::{error};

use crate::sources::anime;
use crate::sources::movie;
use crate::models::search::SearchData;


#[tauri::command]
pub async fn search(source: String, page: usize, search: String) -> Result<Vec<SearchData>, String> {
    if source == "anime" {
        match anime::search::new(page, &search).await {
            Ok(data) => return Ok(data),
            Err(e) => {
                error!("Error: {}", e);
                return Err(e);
            }
        }
    }else if source == "movie" {
        match movie::search::new(page, &search).await {
            Ok(data) => return Ok(data),
            Err(e) => {
                error!("[HOME] Error: {}", e);
                return Err(e)?;
            }
        }
    }
    return Err("Unkown Source".to_string());
}
