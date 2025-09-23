
use crate::models::local_manifest::{LocalManifest, LinkPlugin};
use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};

#[tauri::command]
pub async fn link_plugin(source: String, plugin_id: String, from_id: String, to_id: String) -> Result<(), String> {

    let mut manifest_data: LocalManifest = get_local_manifest(source.clone(), from_id.clone())?;

    manifest_data.link_plugin = Some(LinkPlugin {
        plugin_id: Some(plugin_id.clone()),
        id: Some(to_id.clone())
    });
    
    save_local_manifest(source, from_id, manifest_data)?;

    return Ok(());
}