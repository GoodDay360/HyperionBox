
// Tauri Plugin
import { path } from '@tauri-apps/api';
import { convertFileSrc } from '@tauri-apps/api/core';
import { BaseDirectory, readDir, exists, remove, mkdir, readFile, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';
import start_download from './start_download';
// Node Improt


// Custom Imports
import { read_config } from "../../../global/scripts/manage_config";
import { request_current_task, request_download_task, request_remove_download_task } from "../../../global/scripts/manage_download";
import get_download_info from './get_download_info';
import { download_task_context } from '../../../global/scripts/contexts';
import write_crash_log from '../../../global/scripts/write_crash_log';
import download_file_in_chunks from '../../../global/scripts/download_file_in_chunk';
import execute_command from '../../../global/scripts/excute_command';
import get_yt_dlp_path from '../../../global/scripts/get_yt_dlp_path';
import get_ffmpeg_bin from '../../../global/scripts/get_ffmpeg_bin';
import path_to_file_url from '../../../global/scripts/path_to_url';

const QUALITY_LIST = [240,480,720,1080];

const download_task_worker = async ({download_task_info,download_task_progress}:any)=>{
    
    while (true){
        // const download_cache_dir = await path.join(await path.appDataDir(), ".cache", "download");
        // try{
        //     if (await exists(download_cache_dir)) await remove(download_cache_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
        // }catch(e){
        //     await write_crash_log(`[Download Task] Error remove download cache dir: ${JSON.stringify(e)}`);
        //     console.error(e)
        // }
        
        const request_current_task_result:any = await request_current_task();
        if (request_current_task_result.code === 200){
            const data = request_current_task_result?.data;
            const type_schema = data.type_schema;
            const source_id = data.source_id;
            const season_id = data.season_id;
            const preview_id = data.preview_id;
            const server_type = data.server_type;
            const quality = data.quality;
            const watch_id = data.watch_id;
            const watch_index = data.watch_index;
            const watch_title = data.title;
            
            const main_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id, "download", watch_id)
            const manifest_path = await path.join(main_dir, "manifest.json");

            if (await exists(manifest_path)) {
                try{
                    JSON.parse(await readTextFile(manifest_path, {baseDir:BaseDirectory.AppData}));
                    await write_crash_log(`[Download Task] ${source_id}->${season_id}->${preview_id}->${watch_id} already exist. Skipping...`);
                    await request_remove_download_task({source_id, season_id, preview_id, watch_id: watch_id});
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }catch(e){
                    await write_crash_log(`[Download Task] Error parsing existing manifest. Attempting to download again...`);
                }
            }

            download_task_info.current = {source_id,season_id,preview_id,watch_id,watch_index,watch_title};
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
                            const message = `[Download Task] Error unable to find matching server type for ${source_id}->${season_id}->${preview_id}->${watch_id}`
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

                
                const new_local_source:any = []

                // const prefer_quality = QUALITY_LIST[quality-1];

                // let prefer_source_index = 0;
                // for (const source of watch_data.media_info.source){
                //     if (prefer_quality >= source.quality){
                //         prefer_source_index++;
                //     }
                // }
                
                let prefer_source:any = null;

                // Extract and sort quality values
                const qualities = watch_data.media_info.source.map((item:any) => item.quality).sort((a:number, b:number) => a - b);

                const low = qualities[0];  // Lowest available quality
                const high = qualities[qualities.length - 1];  // Highest available quality
                const step = Math.floor((high - low) / 3); // Divide range into three sections

                // Determine target quality based on user selection
                let targetQuality = 0;
                if (quality === 1) targetQuality = low;
                else if (quality === 2) targetQuality = low + step;
                else if (quality === 3) targetQuality = low + step * 2;
                else if (quality === 4) targetQuality = high;

                // Find the closest matching quality
                for (let i = 0; i < qualities.length; i++) {
                    if (qualities[i] >= targetQuality) {
                        prefer_source = watch_data.media_info.source.find((item:any) => item.quality === qualities[i]);
                    }
                }

                if (!prefer_source) {
                    await write_crash_log(`[Download Task] There an issue finding prefer source: ${source_id}->${season_id}->${preview_id}->${watch_id}`)
                    await write_crash_log(`[Download Task] Removing from download task->skipping...`)
                    await request_remove_download_task({source_id, season_id, preview_id, watch_id: watch_id});
                    console.error(`[Download Task] There an issue finding prefer source: ${source_id}->${season_id}->${preview_id}->${watch_id}`)
                    continue;
                }

                console.log("MOEW",prefer_source)


                const hls_data = await readTextFile(prefer_source.uri, {baseDir:BaseDirectory.AppData});

                download_task_progress.current = {status:"downloading", percent:0, label:"Preparing..."};

                const start_download_result = await start_download({hls_data,main_dir:main_dir, download_task_progress});
                if (start_download_result.code === 200){
                    new_local_source.push({
                        uri: start_download_result.result,
                        type: prefer_source.type,
                        quality: prefer_source.quality
                    })
                    manifest.media_info.source = new_local_source;
                }else{
                    await write_crash_log(`[Download Task] There an issue downloading: ${source_id}->${season_id}->${preview_id}->${watch_id}`)
                    await write_crash_log(`[Download Task] Removing from download task->skipping...`)
                    await request_remove_download_task({source_id, season_id, preview_id, watch_id: watch_id});
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
                
                await request_remove_download_task({source_id, season_id, preview_id, watch_id: watch_id});
            }else{
                await write_crash_log(`[Download Task] There an issue downloading: ${source_id}->${season_id}->${preview_id}->${watch_id}`)
                await write_crash_log(`[Download Task] Removing from download task->skipping...`);
                await request_remove_download_task({source_id, season_id, preview_id, watch_id: watch_id});
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
