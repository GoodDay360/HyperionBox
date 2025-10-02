// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Script Type Imports
import { SearchInPluginData } from '../types/request_plugin_type';


export function search_in_plugin(source: string, pluginId: string, search: string, page: number): Promise<SearchInPluginData[]> {
    
    let search_list = invoke<SearchInPluginData[]>("search_in_plugin", { source, pluginId, search, page });

    return search_list;
}
