use crate::commands::local_manifest::{get_local_manifest, save_local_manifest};
use crate::models::local_manifest::{LinkPlugin, LocalManifest};
use crate::commands::hypersync::favorite::{add_favorite_cache};
use crate::commands::favorite::{get_tag_from_favorite};
use crate::commands::methods::view;

#[tauri::command]
pub async fn link_plugin(
    source: String,
    plugin_id: String,
    from_id: String,
    to_id: String,
) -> Result<(), String> {
    let mut manifest_data: LocalManifest =
        get_local_manifest(source.clone(), from_id.clone()).await?;

    manifest_data.link_plugin = Some(LinkPlugin {
        plugin_id: Some(plugin_id.clone()),
        id: Some(to_id.clone()),
    });

    save_local_manifest(source.clone(), from_id.clone(), manifest_data).await?;

    view::view(source.clone(), from_id.clone(), true).await.ok();

    let tags = get_tag_from_favorite(source.clone(), from_id.clone()).await?;
    if tags.len() > 0 {
        add_favorite_cache(source.clone(), from_id.clone()).await?;
    }

    return Ok(());
}
