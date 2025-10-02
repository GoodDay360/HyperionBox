// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Type Imports
import { ItemFromFavorite } from '../types/manage_favorite_type';

export const request_get_all_tag = (): Promise<string[]> => {
    return invoke<string[]>("get_all_tag")
}

export const request_create_tag = (tagName:string): Promise<void> =>  {
    return invoke("create_tag", {
        tagName
    })
}

export const request_rename_tag = (oldTag:string, newTag:string): Promise<void> => {
    return invoke("rename_tag", {
        oldTag,
        newTag
    })
}


export const request_remove_tag = (tagName:string): Promise<void> => {
    return invoke("remove_tag", {
        tagName
    })
}

export const request_add_favorite = (tagName:string, source:string, id:string): Promise<void> => {
    return invoke("add_favorite", {
        tagName,
        source,
        id
    })
}

export const request_get_tag_from_favorite = (source:string, id:string): Promise<string[]> => {
    if (!source || !id) {
        return Promise.resolve([]);
    }
    return invoke<string[]>("get_tag_from_favorite", {
        source,
        id
    })
}

export const request_get_item_from_favorite = (tagName:string): Promise<ItemFromFavorite[]> => {
    return invoke<ItemFromFavorite[]>("get_item_from_favorite", {
        tagName
    })
}

export const request_remove_favorite = (tagName:string, source:string, id:string): Promise<void> => {
    return invoke("remove_favorite", {
        tagName,
        source,
        id
    })
}