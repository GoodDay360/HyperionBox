// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Types Import
import { GetDownload } from '../types/downloads_type';


export const request_get_download = async ():Promise<Record<string,GetDownload>> => {

    return invoke<Record<string,GetDownload>>("get_download");

}

export const request_set_pause_download = async (source: string, id: string, pause: boolean):Promise<void> => {
    return invoke("set_pause_download", {source, id, pause});
}

export const request_remove_download = async (source: string, id: string):Promise<void> => {
    return invoke("remove_download", {source, id});
}