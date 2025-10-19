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
    return invoke<boolean>('is_available_download');
};

export const get_storage_size = async ():Promise<number> => {
    return invoke<number>('get_storage_size');
};


export const clean_storage = async ():Promise<void> => {
    return invoke<void>('clean_storage');
};

export function format_bytes(bytes:number) {
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);

    return `${value.toFixed(2)} ${units[i]}`;
}
