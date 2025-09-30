#[cfg(test)]
mod tests {
    use std::env;
    use crate::commands;
    use crate::utils;
    use tauri::async_runtime;

    #[tokio::test]
    async fn init() {
        env::set_var("HYPERIONBOX_APPDATA", env::var("APPDATA").unwrap()+"/io.github.goodday360.hyperionbox");
        utils::configs::init().map_err(|e| e.to_string()).unwrap();
    }

    #[tokio::test]
    async fn test() {
        env::set_var("HYPERIONBOX_APPDATA", env::var("APPDATA").unwrap()+"/io.github.goodday360.hyperionbox");
        match commands::download::get_download().await {
            Ok(d) => {
                
                println!("Data: {:?}", d)
            }
            Err(_) => assert!(false),
        }
    }


    use crate::utils::configs;

    #[tokio::test]
    async fn test_setting() {
        let _ = configs::get();
    }
}
