// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Type Imports
import { EpisodeServerData } from '../types/episode_server_type';
import { EpisodeList } from '../types/episode_list_type';
import { ServerData } from '../types/server_type';
import { WatchState } from '../types/watch_state';


export function get_episode_list(source: string, id: string, pluginId: string, linkId: string): Promise<EpisodeList[][][]> {
    return invoke<EpisodeList[][][]>('get_episode_list', {source, id, pluginId, linkId});
}

export function get_episode_server(source: string, id: string, pluginId: string, seasonIndex: number, episodeIndex: number, episodeId: string, updateState: boolean): Promise<EpisodeServerData> {
    return invoke<EpisodeServerData>('get_episode_server', {source, id, pluginId, seasonIndex, episodeIndex, episodeId, updateState});
}

export function get_server(source: string, pluginId: string, id: string): Promise<ServerData> {
    return invoke<ServerData>('get_server', {source, pluginId, id});
}

export function get_watch_state(source: string, id: string, seasonIndex: number, episodeIndex: number): Promise<WatchState> {
    return invoke<WatchState>('get_watch_state', {source, id, seasonIndex, episodeIndex});
}

export function save_watch_state(source: string, id: string, seasonIndex: number, episodeIndex: number, watchState: WatchState): Promise<void> {
    return invoke('save_watch_state', {source, id, seasonIndex, episodeIndex, watchState});
}


export const request_get_local_download_manifest = async (source:string, id:string, seasonIndex: number, episodeIndex: number, updateState: boolean): Promise<ServerData|null> => {
    return invoke<ServerData|null>('get_local_download_manifest',{
        source, id, seasonIndex, episodeIndex, updateState
    });
}