// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Types Imports
import { HomeData } from '../types/home_type';

export const request_home = (
    source: string,
    forceRemote: boolean
): Promise<HomeData> => {
    return invoke<HomeData>('home', {source, forceRemote});
}

