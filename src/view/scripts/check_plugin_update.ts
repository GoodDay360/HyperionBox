import semver from "semver";

import { get_plugin_list, get_plugin_release, get_installed_plugin_list } from "@src/plugins/scripts/manage_plugins"

// Types Imports
import { CheckPluginUpdate } from "../types/check_plugin_update_type";


export default async function check_plugin_update(source:string, plugin_id:string):Promise<CheckPluginUpdate> {
    if (!source || !plugin_id) return {state:false};
    try {
        let installed_plugin_list = await get_installed_plugin_list(source);
        
        let installed_plugin_version = installed_plugin_list[plugin_id].version;

        let plugin_list = await get_plugin_list(source);
        
        let select_plugin_title = plugin_list[plugin_id].title;
        let select_plugin_manifest_url = plugin_list[plugin_id].manifest
        if (!select_plugin_title || !select_plugin_manifest_url) return {state:false};

        

        let plugin_release = await get_plugin_release(select_plugin_manifest_url, "latest");
        

        let should_update = semver.gt(plugin_release.version, installed_plugin_version);

        if (should_update) {
            return {
                state: true,
                source,
                pluginId:plugin_id,
                pluginManifest: {
                    title: select_plugin_title,
                    manifest: select_plugin_manifest_url
                }
            }
        }
        

    }catch(e){
        console.error(e);
    }

    return {state:false}
}