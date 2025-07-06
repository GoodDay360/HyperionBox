
// Tauri Plugin
import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, mkdir, readFile, writeTextFile, readTextFile, remove } from '@tauri-apps/plugin-fs';

// Node Improt
import { Parser } from 'm3u8-parser';

// Custom Imports

import { request_current_task, request_remove_download_task, request_set_error_task } from "../../global/scripts/manage_download";
import get_download_info from './get_download_info';

import write_crash_log from '../../global/scripts/write_crash_log';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import manage_download from './manage_download';
import { read_config, write_config } from '../../global/scripts/manage_config';

const DEFAULT_MAX_THREAD = 3;

function pickStreamByQuality(
    data: {
        attributes: {
        CODECS: string;
        "FRAME-RATE": number;
        RESOLUTION: { width: number; height: number };
        BANDWIDTH: number;
        "PROGRAM-ID": number;
        };
        uri: string;
        timeline: number;
    }[],
    quality: 1 | 2 | 3 | 4
    ) {
    const sorted = [...data].sort((a, b) => {
        const areaA = a.attributes.RESOLUTION.width * a.attributes.RESOLUTION.height;
        const areaB = b.attributes.RESOLUTION.width * b.attributes.RESOLUTION.height;
        return areaA - areaB;
    });

    const indexMap = {
        1: 0, // lowest
        2: Math.floor((sorted.length - 1) / 3),
        3: Math.floor((2 * (sorted.length - 1)) / 3),
        4: sorted.length - 1 // highest
    };

    return sorted[indexMap[quality]];
}


const download_task_worker = async ({pause_download_task,download_task_info,download_task_progress}:any)=>{
    const config_manifest = await read_config();
    if (!config_manifest.max_download_thread){
        config_manifest.max_download_thread = DEFAULT_MAX_THREAD;
    }
    await write_config(config_manifest);

    const download_cache_dir = await path.join(await path.appDataDir(), ".cache", "download");
    
    if (!import.meta.env.DEV || import.meta.env.VITE_DEV_SKIP_CLEAN_UP_CACHE === "0"){
        try{
            if (await exists(download_cache_dir)) await remove(download_cache_dir, {baseDir:BaseDirectory.AppData, recursive:true})
        }catch(e){
            await write_crash_log(`[Download Task] Error remove download cache dir: ${JSON.stringify(e)}`);
            console.error(e)
        }
    }
    
    while (true){
        
        download_task_progress.current = {};
        if (pause_download_task.current) {
            await new Promise(resolve => setTimeout(resolve, 8000));
            continue;
        }

        const request_current_task_result:any = await request_current_task();
        if (request_current_task_result.code === 200){
            const data = request_current_task_result?.data;
            const type_schema = data.type_schema;
            const source_id = data.source_id;
            const preview_id = data.preview_id;
            const season_id = data.season_id;
            const server_type = data.server_type;
            const quality = data.quality;
            const watch_id = data.watch_id;
            const watch_index = data.watch_index;
            const watch_title = data.title;
            
            const main_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id, season_id, "download", watch_id)
            const manifest_path = await path.join(main_dir, "manifest.json");

            if (await exists(manifest_path)) {
                try{
                    JSON.parse(await readTextFile(manifest_path, {baseDir:BaseDirectory.AppData}));
                    await write_crash_log(`[Download Task] ${source_id}->${preview_id}->${season_id}->${watch_id} already exist. Skipping...`);
                    await request_remove_download_task({source_id, preview_id, season_id, watch_id: watch_id});
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }catch(e){
                    await write_crash_log(`[Download Task] Error parsing existing manifest. Attempting to download again...`);
                }
            }

            download_task_info.current = {source_id,preview_id,season_id,watch_id,watch_index,watch_title};
            let retry = 0;
            let info_result:any;

            while (true){
                const get_download_info_result = await get_download_info({
                    source_id,preview_id,watch_id:watch_id,
                    server_type:server_type,
                    force_update:false
                });
                if (get_download_info_result.code === 200){
                    const data = get_download_info_result.result;
                    console.log("aa", data.server_info.current_server_type , server_type)
                    if (data.server_info.current_server_type !== server_type) {
                        if (retry >= 3) {
                            const message = `[Download Task] Error unable to find matching server type for ${source_id}->${preview_id}->${season_id}->${watch_id}`
                            await write_crash_log(message);
                            console.error(message);
                            info_result = {code:404, message};
                            break;
                        }else{
                            retry += 1;
                            continue;
                        }
                    }else {
                        info_result = get_download_info_result;
                        break;
                    };
                }else {
                    info_result = get_download_info_result;
                    break;
                };
            }
            if (info_result.code === 200){
                const watch_data = info_result.result;
                
                await mkdir(main_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});
                const manifest:any = {}
                
                manifest.media_info = {}
                manifest.type_schema = type_schema;
                manifest.episodes = watch_data.episodes;

                manifest.media_info.type = "local";

                
                let prefer_source:any = null;

                
                if (watch_data.media_info.type === "master") {
                    const master_content:string = await readTextFile(watch_data.media_info.source, {baseDir:BaseDirectory.AppData});
                    const praser = new Parser();
                    praser.push(master_content);
                    praser.end();

                    const parsedManifest:any = praser.manifest;
                    
                    const pick_result = pickStreamByQuality(parsedManifest.playlists, quality);

                    prefer_source = pick_result.uri;


                }else{
                    prefer_source = watch_data.media_info.source;
                }
                


                if (!prefer_source) {
                    await write_crash_log(`[Download Task] There an issue finding prefer source: ${source_id}->${preview_id}->${season_id}->${watch_id}`)
                    await write_crash_log(`[Download Task] Removing from download task->skipping...`)
                    await request_set_error_task({source_id, preview_id, season_id, watch_id: watch_id, error: true});
                    console.error(`[Download Task] There an issue finding prefer source: ${source_id}->${preview_id}->${season_id}->${watch_id}`)
                    continue;
                }

                console.log("MOEW",prefer_source)


                const player_data = await readTextFile(prefer_source, {baseDir:BaseDirectory.AppData});

                download_task_progress.current = {status:"downloading", percent:0, label:"Preparing..."};

                const manage_download_result = await manage_download({player_data,main_dir:main_dir, pause_download_task,download_task_progress});
                if (manage_download_result.code === 200){
                    manifest.media_info.source = manage_download_result.result;
                }else if (manage_download_result.code === 410){
                    continue;
                }else{
                    console.error(`[Download Task] There an issue downloading: ${source_id}->${preview_id}->${season_id}->${watch_id} => ${manage_download_result.message}`);
                    await write_crash_log(`[Download Task] There an issue downloading: ${source_id}->${preview_id}->${season_id}->${watch_id} => ${manage_download_result.message}`)
                    await write_crash_log(`[Download Task] Removing from download task->skipping...`)
                    await request_set_error_task({source_id, preview_id, season_id, watch_id: watch_id, error:true});
                    continue;
                }

                // ==============================

                // Download track
                const track_list = watch_data.media_info.track;
                const local_track_dir = await path.join(main_dir, "track");
                await mkdir(local_track_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});
                const new_local_track_list = [];
                for (const track of track_list){
                    const track_path = await path.join(local_track_dir, `${track.label}.vtt`); 

                    let start_size = 0;
                    if (await exists(track_path)) {
                        const file = await readFile(track_path, {baseDir:BaseDirectory.Temp});
                        start_size = file.byteLength;
                    
                    }
                    await download_file_in_chunks({url:track.url,output_file:track_path,start_size});
                    new_local_track_list.push({
                        url:track_path,
                        label:track.label,
                        type:"captions",
                    });
                }
                
                manifest.media_info.track = new_local_track_list
                
                /// ======================================

                
                await writeTextFile(manifest_path, JSON.stringify(manifest), {baseDir:BaseDirectory.AppData}).catch(e=>{console.error("[Error] Write manifest: ",e)});
                
                await request_remove_download_task({source_id, preview_id, season_id, watch_id: watch_id});
            }else{
                await write_crash_log(`[Download Task] There an issue downloading: ${source_id}->${preview_id}->${season_id}->${watch_id}`)
                await write_crash_log(`[Download Task] Removing from download task->skipping...`);
                await request_set_error_task({source_id, preview_id, season_id, watch_id: watch_id, error:true});
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }else{
            download_task_info.current = {};
            await new Promise(resolve => setTimeout(resolve, 8000));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

export default download_task_worker;
