use tracing::{error, info};
use serde::{Deserialize, Serialize};
use reqwest::{
    Client, 
    header::{ HeaderMap,  HeaderValue, HOST, REFERER, ORIGIN, USER_AGENT, ACCEPT, ACCEPT_ENCODING }
};
use lazy_static::lazy_static;
use dashmap::DashMap;
use url::Url;




#[derive(Debug, Deserialize, Serialize)]
pub struct Headers {
    pub host: Option<String>,
    pub referer: Option<String>,
    pub origin: Option<String>
}


#[derive(Debug, Deserialize, Serialize)]
pub struct Response {
    pub status: usize,
    pub url: String,
    pub data: Vec<u8>,

}


lazy_static!{
    pub static ref CLIENT: DashMap<usize, Client> = DashMap::new();
}

#[tauri::command]
pub async fn get_playlist(url: String, headers: Headers) -> Result<Response, String> {    

    let mut headers_map = HeaderMap::new();

    if let Some(host) = &headers.host {
        headers_map.insert(HOST, 
            HeaderValue::from_str(&host).map_err(|e| e.to_string())?
        );
    }

    if let Some(referer) = &headers.referer {
        headers_map.insert(REFERER, 
            HeaderValue::from_str(&referer).map_err(|e| e.to_string())?
        );
    }

    if let Some(origin) = &headers.origin {
        headers_map.insert(ORIGIN, 
            HeaderValue::from_str(&origin).map_err(|e| e.to_string())?
        );
    }

    headers_map.insert(USER_AGENT, HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"));
    headers_map.insert(ACCEPT, HeaderValue::from_static("*/*"));
    headers_map.insert(ACCEPT_ENCODING, HeaderValue::from_static("gzip, deflate, br"));

    info!("[get_playlist] url: {}, headers: {:#?}", url, headers_map);


    let client = Client::builder()
        .cookie_store(true)
        .pool_idle_timeout(None)
        .pool_max_idle_per_host(5)
        .default_headers(headers_map.clone())
        .build()
        .map_err(|e| e.to_string())?;
    

    let mut _current_url: String = url.clone();
    
    loop {
        
        
        let res = client.get(&_current_url)
            .send()
            .await
            .map_err(|e| {
                error!("[get_playlist] Error: {}", e);
                e.to_string()
            })?;
        
        
        

        let res_status = res.status().as_u16();
        let res_url = res.url().to_string();


        if res_url != _current_url {
            _current_url = res_url;
            let redirect_url = res.url();
            let redirect_host = redirect_url.host_str().ok_or("no host")?.to_string();
            headers_map.insert(HOST, 
                HeaderValue::from_str(&redirect_host).map_err(|e| e.to_string())?
            );

            continue;
        }

        if !res.status().is_success() {
            let status = res.status();
            error!("[get_playlist] Error Status: {}", status);
            error!("[get_playlist] Error Text: {}", res.text().await.map_err(|e| e.to_string())?);
            return Err(status.to_string());
        }
        

        CLIENT.insert(0, client);

        
        let data = res.bytes().await.map_err(|e| e.to_string())?;

        info!("[get_playlist] status: {}", res_status);

        return Ok(Response {
            status: res_status as usize,
            url: url,
            data:data.to_vec(),
        });
    }
    
}


#[tauri::command]
pub async fn get_fragment(url: String, headers: Headers) -> Result<Response, String> {    

    let mut headers_map = HeaderMap::new();

    if let Some(host) = &headers.host {
        let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;
        let parsed_url_host = parsed_url.host_str().ok_or("no host")?.to_string();
        let new_host = if host == &parsed_url_host { host } else { &parsed_url_host };

        headers_map.insert(HOST, 
            HeaderValue::from_str(new_host).map_err(|e| e.to_string())?
        );
    }

    if let Some(referer) = &headers.referer {
        headers_map.insert(REFERER, 
            HeaderValue::from_str(&referer).map_err(|e| e.to_string())?
        );
    }

    if let Some(origin) = &headers.origin {
        headers_map.insert(ORIGIN, 
            HeaderValue::from_str(&origin).map_err(|e| e.to_string())?
        );
    }

    headers_map.insert(USER_AGENT, HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"));
    headers_map.insert(ACCEPT, HeaderValue::from_static("*/*"));
    headers_map.insert(ACCEPT_ENCODING, HeaderValue::from_static("gzip, deflate, br"));

    info!("[get_fragment] url: {}, headers: {:#?}", url, headers_map);

    let client = CLIENT.get(&0).ok_or("[get_fragment] Client not setup yet")?;
    
    let mut _current_url: String = url.clone();

    loop {
        
        
        let res = client
            .get(_current_url.clone())
            .headers(headers_map.clone())
            .send()
            .await
            .map_err(|e| {
                error!("[get_fragment] Error: {}", e);
                e.to_string()
            })?;
        
        
        

        let res_status = res.status().as_u16();
        let res_url = res.url().to_string();

        if res_url != _current_url {
            _current_url = res_url;
            let redirect_url = res.url();
            let redirect_host = redirect_url.host_str().ok_or("no host")?.to_string();
            headers_map.insert(HOST, 
                HeaderValue::from_str(&redirect_host).map_err(|e| e.to_string())?
            );

            continue;
        }

        if !res.status().is_success() {
            let status = res.status();
            error!("[get_fragment] Error Status: {}", status);
            error!("[get_fragment] Error Text: {}", res.text().await.map_err(|e| e.to_string())?);
            return Err(status.to_string());
        }
        
        
        let data = res.bytes().await.map_err(|e| e.to_string())?;

        info!("[get_fragment] status: {}", res_status);
        
        return Ok(Response {
            status: res_status as usize,
            url: url,
            data:data.to_vec(),
        });
        
    }
    
}