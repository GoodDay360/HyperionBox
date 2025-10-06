#[cfg(test)]
mod tests {
    use crate::commands;
    use crate::sources;
    use crate::utils;
    use std::env;
    use tauri::async_runtime;

    // #[tokio::test]
    // async fn init() {
    //     env::set_var(
    //         "HYPERIONBOX_APPDATA",
    //         env::var("APPDATA").unwrap() + "/io.github.goodday360.hyperionbox",
    //     );
    //     utils::configs::init().map_err(|e| e.to_string()).unwrap();
    // }

    #[tokio::test]
    async fn test() {
        env::set_var(
            "HYPERIONBOX_APPDATA",
            env::var("APPDATA").unwrap() + "/io.github.goodday360.hyperionbox",
        );
        match sources::movie::home::new().await {
            Ok(d) => {
                println!("Data: {:?}", d)
            }
            Err(e) => {
                println!("Error: {}", e);
            }
        }
    }

    // use crate::utils::configs;

    // #[tokio::test]
    // async fn test_setting() {
    //     let _ = configs::get();
    // }
}
