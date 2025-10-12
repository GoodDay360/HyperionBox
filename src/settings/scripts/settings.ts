// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Types Imports
import { Configs } from '../types/settings_type';

export const get_configs = async ():Promise<Configs> => {
    return invoke<Configs>('get_configs');
};


export const set_configs = async (configs:Configs):Promise<void> => {
    return invoke('set_configs', {configs})
};


export const is_available_download = async ():Promise<boolean> => {
    return invoke('is_available_download');
};