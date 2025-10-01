// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Types Imports
import { Configs } from '../types/configs_type';

export const get_configs = async ():Promise<Configs> => {
    return invoke<Configs>('get_configs');
};