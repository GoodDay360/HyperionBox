// Tauri API
import { invoke } from '@tauri-apps/api/core';

// Types Imports
import { ViewData } from '../types/view_type';

export const request_view = (
    source: string,
    id: string,
    forceRemote: boolean
): Promise<ViewData> => {
    return invoke<ViewData>('view', {source, id, forceRemote});
}

