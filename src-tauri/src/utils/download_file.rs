use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::Client;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use tokio::time::Duration;
use url::Url;

pub async fn new<F>(
    url: &str,
    output_file: &str,
    headers: HeaderMap,
    callback: F,
) -> Result<(), String>
where
    F: Fn(usize, usize),
{
    let mut new_headers = headers.clone();
    let mut current_url: String = url.to_string();
    loop {
        let client = Client::new();
        let response = client
            .get(current_url.clone())
            .timeout(Duration::from_secs(30))
            .headers(new_headers.clone())
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if response.url().to_string() != current_url {
            let parsed_url = Url::parse(&current_url).map_err(|e| e.to_string())?;
            let new_host = parsed_url
                .host_str()
                .ok_or_else(|| "Host not found from parsed URL.")?;
            new_headers.insert(
                "Host",
                HeaderValue::from_str(new_host).map_err(|e| e.to_string())?,
            );

            current_url = response.url().to_string();
            continue;
        }
        if response.status().is_success() {
            let total_size = response
                .content_length()
                .ok_or_else(|| "Can't determine content length".to_string())?;

            let path = Path::new(output_file);
            let mut file =
                File::create(&path).map_err(|e| format!("Failed to create file: {}", e))?;

            let mut downloaded = 0;
            let mut stream = response.bytes_stream();

            while let Some(chunk) = stream.next().await {
                let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
                file.write_all(&chunk)
                    .map_err(|e| format!("Write error: {}", e))?;
                downloaded += chunk.len();
                callback(downloaded, total_size as usize);
            }
            break;
        } else {
            return Err(format!("Request failed: {}", response.status()));
        }
    }
    Ok(())
}
