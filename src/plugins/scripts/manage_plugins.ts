// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Script Type Imports
import { PluginData, InstalledPluginData, PluginRelease } from '../types/manage_plugin_type';


export function get_plugin_list(source: string): Promise<Record<string, PluginData>> {
    
    let plugin_list = invoke<Record<string, PluginData>>("get_plugin_list", { source });

    return plugin_list;
}

export function get_plugin_release(manifestUrl: string, version: string): Promise<PluginRelease> {
    console.log(manifestUrl, version)
    let plugin_release = invoke<PluginRelease>("get_plugin_release", { manifestUrl, version });

    return plugin_release;
}


export function get_installed_plugin_list(source: string): Promise<Record<string, InstalledPluginData>> {
    
    let installed_plugin_list = invoke<Record<string, InstalledPluginData>>("get_installed_plugin_list", { source });

    return installed_plugin_list;
}

export function remove_plugin(source: string, pluginId: string) {
    
    let remove_plugin = invoke("remove_plugin", { source, pluginId });

    return remove_plugin;
}


export function install_plugin(source: string, pluginId: string, pluginManifest: {title: string, manifest: string}): Promise<Record<string, PluginData>> {
    
    let plugin_list = invoke<Record<string, PluginData>>("install_plugin", { source, pluginId, pluginManifest });

    return plugin_list;
}