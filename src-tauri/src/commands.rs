use std::collections::HashMap;
use crate::anime;
use tauri::async_runtime;


#[tauri::command]
pub fn home(source: String) -> Result<HashMap<String, Vec<anime::home::Content>>, String> {
    if source == "anime" {
        let result = async_runtime::block_on(async move {
            match anime::home::new().await {
                Ok(data) => Ok(data),
                Err(e) => Err(e),
            }
        });
        
        match result {
            Ok(data) => return Ok(data),
            Err(e) => return Err(e.to_string())?,
        }
        
    }

    return Err(format!("Invalid source: {}", source));
}