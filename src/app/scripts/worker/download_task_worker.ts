
// Tauri Plugin
import { path } from '@tauri-apps/api';
import { convertFileSrc } from '@tauri-apps/api/core';
import { BaseDirectory, readDir, exists, remove, mkdir, readFile, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';

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

const download_task_worker = async ({set_download_task_info,download_task_progress}:any)=>{
    
    while (true){
        const download_cache_dir = await path.join(await path.appDataDir(), ".download_cache");
        try{
            if (await exists(download_cache_dir)) await remove(download_cache_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
        }catch(e){
            await write_crash_log(`[Download Task] Error remove download cache dir: ${JSON.stringify(e)}`);
            console.error(e)
        }
        
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

            set_download_task_info({source_id,season_id,preview_id,watch_id,watch_index,watch_title})
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
                    await write_crash_log(`[Download Task] There an issue downloading: ${source_id}->${season_id}->${preview_id}->${watch_id}`)
                    await write_crash_log(`[Download Task] Removing from download task->skipping...`)
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

                // Download HLS->Convert HLS to MP4
                const new_local_source:any = []
                const prefer_quality = QUALITY_LIST[quality-1];

                let prefer_source_index = 0;
                for (const source of watch_data.media_info.source){
                    if (prefer_quality >= source.quality){
                        prefer_source_index++;
                    }
                }
                
                const prefer_source = watch_data.media_info.source[prefer_source_index > 0 ? prefer_source_index-1 : 0];
                
                const command = [
                    `SET "FILEURL=${path_to_file_url(prefer_source.uri)}"`, "\n",
                    "SETLOCAL ENABLEDELAYEDEXPANSION", "\n",
                    `"${await get_yt_dlp_path}"`, "--enable-file-urls",
                    "--ffmpeg-location", `"${await get_ffmpeg_bin}"`,
                    "--retries", "5", "--abort-on-unavailable-fragments",
                    "--progress-template", `"%%(progress)j"`,
                    `"!FILEURL!"`, "-o", `"${watch_id}.mp4"`, "\n",
                    "ENDLOCAL"
                ].join(" ");
                console.log(command)
                const executor = await execute_command({title:"download_task",command,wait:false,spawn:false,cwd:main_dir});

                const executor_result:any = await new Promise((resolve, _) => {
                    executor.stdout.on('data', (line:string) => {
                        try{
                            const info = JSON.parse(line);
                            download_task_progress.current = info;
                            if (info.status === "finished"){
                                resolve({code:200, message:"OK"});
                            }
                        }catch{}
                    });
                    
                    const child = executor.spawn();

                    executor.stderr.on('data', async (line:string) => {
                        console.error(`stderr: ${line}`);
                        console.log('Error detected, terminating process...');
                        child.kill();
                        await write_crash_log(`[yt-dlp] There an issue downloading: ${source_id}->${season_id}->${preview_id}->${watch_id}`);
                        resolve({code:500, message:line});
                    });
                    
                    executor.on('error', async (error:any) => {
                        console.error(`Error: ${error}`);
                        await write_crash_log(`[yt-dlp] There an issue downloading: ${source_id}->${season_id}->${preview_id}->${watch_id}`);
                        resolve({code:500, message:error});
                    });

                    executor.on('close', (data:any) => {
                        console.log(`[yt-dlp] Process exited with: `, data);
                    });
                });

                if (executor_result.code === 200){
                    new_local_source.push({
                        uri: convertFileSrc(await path.join(main_dir, `${watch_id}.mp4`)),
                        type: prefer_source.type,
                        quality: prefer_source.quality
                    })
                    manifest.media_info.source = new_local_source;
                }else{
                    continue;
                }

                // ==============================

                // Download CC
                const cc_list = watch_data.media_info.cc;
                const local_cc_dir = await path.join(main_dir, "cc");
                await mkdir(local_cc_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});
                const new_local_cc_list = [];
                for (const cc of cc_list){
                    const cc_key = Object.keys(cc)[0];
                    const cc_url = cc[cc_key];
                    const cc_path = await path.join(local_cc_dir, `${cc_key}.vtt`); 

                    let start_size = 0;
                    if (await exists(cc_path)) {
                        const file = await readFile(cc_path, {baseDir:BaseDirectory.Temp});
                        start_size = file.byteLength;
                    
                    }
                    await download_file_in_chunks({url:cc_url,output_file:cc_path,start_size});
                    new_local_cc_list.push({[cc_key]:convertFileSrc(cc_path)});
                }
                
                manifest.media_info.cc = new_local_cc_list
                
                /// ======================================

                
                await writeTextFile(manifest_path, JSON.stringify(manifest), {baseDir:BaseDirectory.AppData}).catch(e=>{console.error("[Error] Write manifest: ",e)});
                
                await request_remove_download_task({source_id, season_id, preview_id, watch_id: watch_id});
            }else{
                await request_remove_download_task({source_id, season_id, preview_id, watch_id});
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }else{
            set_download_task_info({})
            await new Promise(resolve => setTimeout(resolve, 8000));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

export default download_task_worker;
