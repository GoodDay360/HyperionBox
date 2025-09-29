// Tauri API
import { invoke } from '@tauri-apps/api/core';

export const add_download = (
    source: string,
    id: string,
    pluginId: string,
    seasonIndex: number,
    episodeIndex: number,
    episodeId: string,
    preferServerType: string,
    preferServerIndex: number,
    preferQuality: number
): Promise<void> => {
    return invoke('add_download', {
        source, id, pluginId, 
        seasonIndex, episodeIndex, episodeId,
        preferServerType, preferServerIndex, preferQuality
    });
}