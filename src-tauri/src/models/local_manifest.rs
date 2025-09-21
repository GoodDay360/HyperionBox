use crate::models::view::ViewData;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LinkPlugin {
    pub plugin_id: Option<String>,
    pub id: Option<String>,
}


#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LocalManifest {
    pub view_data: Option<ViewData>,
    pub link_plugin: Option<LinkPlugin>,
}

impl LocalManifest {
    pub fn default() -> LocalManifest {
        LocalManifest {
            view_data: None,
            link_plugin: None,
        }
    }
}