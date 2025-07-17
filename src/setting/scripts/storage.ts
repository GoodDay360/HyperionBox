// Tauri Plugin
import { path } from '@tauri-apps/api';
import { readDir, remove, BaseDirectory, exists } from '@tauri-apps/plugin-fs';

// Custom Imports
import { request_item_tags } from '../../global/scripts/manage_tag';
import { get_data_storage_dir } from '../../global/scripts/manage_data_storage_dir';

export function format_size(bytes: number): { unit: string; value: number } {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;

    while (bytes >= 1024 && index < units.length - 1) {
        bytes /= 1024;
        index++;
    }

    return {
        unit: units[index],
        value: parseFloat(bytes.toFixed(2)), // rounded to 2 decimal places
    };
}


export const clean_up_cache = async () => {
    
    const local_data_dir = await get_data_storage_dir();
    const local_data_entries = await readDir(local_data_dir);
    

    for (const local_data_entry of local_data_entries) {
        
        if (local_data_entry.isDirectory) {
            const source_id = local_data_entry.name;
            const source_dir = await path.join(local_data_dir, source_id);

            const source_entries = await readDir(source_dir);

            for (const source_entry of source_entries) {
                if (source_entry.isDirectory) {
                    const preview_id = source_entry.name;
                    const preview_dir = await path.join(source_dir, preview_id);
                    
                    
                    const request_item_tags_result:any = await request_item_tags({source_id,preview_id});
                    
                    let exist_in_watchlist = false;

                    if (request_item_tags_result.code === 200) {
                        if (request_item_tags_result.data.length > 0) {
                            exist_in_watchlist = true;
                        }
                    }

                    console.log(exist_in_watchlist)
                    
                    if (!exist_in_watchlist) {
                        await remove(preview_dir ,{baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)})
                    }

                }
            }

        }
    }
}


export const clean_up_download = async () => {
    
    const local_data_dir = await get_data_storage_dir();
    const local_data_entries = await readDir(local_data_dir);
    

    for (const local_data_entry of local_data_entries) {
        
        if (local_data_entry.isDirectory) {
            const source_id = local_data_entry.name;
            const source_dir = await path.join(local_data_dir, source_id);

            const source_entries = await readDir(source_dir);

            for (const source_entry of source_entries) {
                if (source_entry.isDirectory) {
                    const preview_id = source_entry.name;
                    const preview_dir = await path.join(source_dir, preview_id);

                    const  preview_entries = await readDir(preview_dir);
                    for (const preview_entry of preview_entries) {
                        if (preview_entry.isDirectory) {
                            const season_dir = await path.join(preview_dir, preview_entry.name);
                            
                            const download_dir = await path.join(season_dir, "download");
                            if (await exists(download_dir)) {
                                await remove(download_dir ,{baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)})
                            }
                        }
                    }
                    

                }
            }

        }
    }
}