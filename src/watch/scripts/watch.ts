// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Type Imports
import { EpisodeServerData } from '../types/episode_server_type';
import { EpisodeList } from '../types/episode_list_type';
import { ServerData } from '../types/server_type';


export function get_episode_list(source: string, pluginId: string, id: string): Promise<EpisodeList[][][]> {
    return invoke<EpisodeList[][][]>('get_episode_list', {source, pluginId, id});
}

export function get_episode_server(source: string, pluginId: string, id: string): Promise<EpisodeServerData> {
    return invoke<EpisodeServerData>('get_episode_server', {source, pluginId, id});
}

export function get_server(source: string, pluginId: string, id: string): Promise<ServerData> {
    return invoke<ServerData>('get_server', {source, pluginId, id});
}

