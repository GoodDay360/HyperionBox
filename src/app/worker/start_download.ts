import { Parser } from 'm3u8-parser';
import { convertFileSrc } from '@tauri-apps/api/core';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readDir, exists, remove, mkdir, readFile, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import write_crash_log from '../../global/scripts/write_crash_log';

const start_download = async ({hls_data,main_dir, pause_download_task, download_task_progress}:{hls_data:string,main_dir:string, pause_download_task:any, download_task_progress:any})=>{
    // Parse the M3U8 content
    try{
        const download_manifest_path = await path.join(main_dir, "download_manifest.json");
        const segment_dir = await path.join(main_dir, "segment");
        const parser = new Parser();
        parser.push(hls_data);
        parser.end();
        const parsedManifest = parser.manifest;

        const max_segment_count = parsedManifest.segments.length;

        // Replace segment URIs with full URLs
        for (const [index, segment] of parsedManifest.segments.entries()) {
            if (pause_download_task.current) {
                return {code:410, message:"PAUSED"}
            }
            
            await mkdir(segment_dir, { recursive: true, baseDir: BaseDirectory.AppData }).catch((e) => { console.error(e) });

            const segment_path = await path.join(segment_dir,`segment-${index}`)
            
            let download_manifest_data = {segment_index:-1};
            try{
                if (await exists(download_manifest_path)) {
                    download_manifest_data = JSON.parse(await readTextFile(download_manifest_path, {baseDir:BaseDirectory.AppData}));
                }
            }catch(e){
                console.error(e);
            }

            if (index > download_manifest_data.segment_index ) {
                let retry = 0
                while (true){
                    const download_result = await download_file_in_chunks({url: segment.uri, output_file: segment_path,
                        callback: ({current_size,total_size}:any) => {
                            console.log(`${current_size}/${total_size}`);
                            download_task_progress.current = {status: "downloading", percent:((index+(current_size/total_size))/max_segment_count)*100, label:`${index}/${max_segment_count}`};
                        }

                    });
                    if (download_result.code === 200) {
                        segment.uri = segment_path;
                        break;
                    }else if (retry >= 3) {
                        console.error(`[Download Task] Failed to download segment after ${retry} retries`);
                        await remove(main_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e) => { console.error(e) });
                        await write_crash_log(`[Download Task] Failed to download segment after ${retry} retries`);
                        await write_crash_log(`Directory: ${main_dir} -> will be removed`);
                        return {code:500, message:"Failed to download segment after 3 retries"};
                    };
                    retry++
                }
                
                download_manifest_data.segment_index = index;
                await writeTextFile(download_manifest_path, JSON.stringify(download_manifest_data), {baseDir:BaseDirectory.AppData, create: true}).catch((e) => { console.error(e) });
            }else{
                segment.uri = segment_path;
            }

            download_task_progress.current = {status: "downloading", percent:((index+1)/max_segment_count)*100, label:`${index+1}/${max_segment_count}`};
        }
        download_task_progress.current = {status: "finished", percent:100, label:`${max_segment_count}/${max_segment_count}`};

        // Collect headers until the first #EXTINF tag
        const headerLines = [];
        const splited = hls_data.split("\n");
        for (const line of splited) {
        if (line.includes("#EXTINF")) break;
            headerLines.push(line);
        }

        const headers = headerLines.join("\n");

        // Build the modified M3U8 content
        let outputdata = headers + "\n";

        parsedManifest.segments.forEach((segment) => {
            outputdata += `#EXTINF:${segment.duration},\n${segment.uri}\n`;
        });

        if (parsedManifest.endList) outputdata += `#EXT-X-ENDLIST\n`;

        const output_file = await path.join(main_dir, "player.m3u8")
        await writeTextFile(output_file, outputdata, {baseDir:BaseDirectory.AppData, create:true}).catch((e)=>{console.error(e)});
        await remove(download_manifest_path, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});


        return {code:200, message:"OK", result: output_file}
    }catch(e:any){
        console.error("Error", e)
        console.error("Error message:", e.message);
        console.error("Stack trace:", e.stack);
        return {code:500, message:e}
    }
}

export default start_download;