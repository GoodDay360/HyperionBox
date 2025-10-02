// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Types Imports


export const pick_dir = async ():Promise<string> => {
    return invoke<string>('pick_dir');
};
