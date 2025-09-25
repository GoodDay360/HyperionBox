use crate::models::view::ManifestData;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LinkPlugin {
    pub plugin_id: Option<String>,
    pub id: Option<String>,
}


#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LocalManifest {
    pub manifest_data: Option<ManifestData>,
    pub link_plugin: Option<LinkPlugin>,
}

impl LocalManifest {
    pub fn default() -> LocalManifest {
        LocalManifest {
            manifest_data: None,
            link_plugin: None,
        }
    }
}