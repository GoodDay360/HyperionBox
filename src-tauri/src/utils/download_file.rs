use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::{Client, Response};
use std::fs::File;
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;
use tokio::time::Duration;
use url::Url;

pub async fn new<F>(
    url: &str,
    output_file: &PathBuf,
    headers: Option<HeaderMap>,
    timeout: usize,
    callback: F,
) -> Result<(), String>
where
    F: Fn(usize, usize),
{
    // println!("[download_file] Downloading: {}", &url);
    
    loop {
        let client = Client::new();

        let response: Response;

        if let Some(some_headers) = &headers {
            let mut new_headers = some_headers.clone();
            let mut _current_url: String = url.to_string();
            response = client
                .get(_current_url.clone())
                .timeout(Duration::from_secs(timeout as u64))
                .headers(new_headers.clone())
                .send()
                .await
                .map_err(|e| format!("[download_file] Request failed: {}", e))?;

            if response.url().to_string() != _current_url {
                let parsed_url = Url::parse(&_current_url).map_err(|e| e.to_string())?;
                let new_host = parsed_url
                    .host_str()
                    .ok_or_else(|| "[download_file] Host not found from parsed URL.")?;
                new_headers.insert(
                    "Host",
                    HeaderValue::from_str(new_host).map_err(|e| e.to_string())?,
                );

                _current_url = response.url().to_string();
                continue;
            }
        }else{
            response = client
                .get(url.to_string())
                .timeout(Duration::from_secs(timeout as u64))
                .send()
                .await
                .map_err(|e| format!("[download_file] Request failed: {}", e))?;
        }
        if response.status().is_success() {
            let total_size = response
                .content_length().unwrap_or(0);

            let path = Path::new(output_file);
            let mut file =
                File::create(&path).map_err(|e| format!("[download_file] Failed to create file: {}", e))?;

            let mut downloaded = 0;
            let mut stream = response.bytes_stream();

            while let Some(chunk) = stream.next().await {
                let chunk = chunk.map_err(|e| format!("[download_file] Stream error: {}", e))?;
                file.write_all(&chunk)
                    .map_err(|e| format!("[download_file] Write error: {}", e))?;
                downloaded += chunk.len();
                if total_size > 0 {
                    callback(downloaded, total_size as usize);
                }
            }
            break;
        } else {
            return Err(format!("[download_file] Request failed: {}", response.status()));
        }
    }
    Ok(())
}
