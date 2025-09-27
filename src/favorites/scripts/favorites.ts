// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Types Import
import { LocalManifest, ManifestData } from '../types/favorites';


export const get_local_manifest_data = async (source:string, id:string): Promise<ManifestData | undefined> => {
    try {
        const local_manifest = await invoke<LocalManifest>("get_local_manifest", {source, id})
        
        return local_manifest.manifest_data;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}