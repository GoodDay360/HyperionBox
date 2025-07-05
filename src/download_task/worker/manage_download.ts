import { Parser } from 'm3u8-parser';
import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, remove, mkdir, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import write_crash_log from '../../global/scripts/write_crash_log';
import { read_config } from '../../global/scripts/manage_config';


const work_status = {code:200, message:""}; // set to not 200 when there error occured on any thread and all thread will stop.
function split_work<T>(work: T[], max_thread: number): { start_index: number; end_index: number; thread_progress: {current:number}, result: T[] }[] {
    const total = work.length;
    const baseSize = Math.floor(total / max_thread);
    const remainder = total % max_thread;

    const result: { start_index: number; end_index: number; thread_progress: {current:number}, result: T[] }[] = [];
    let start = 0;

    for (let i = 0; i < max_thread; i++) {
        const size = i === max_thread - 1 ? baseSize + remainder : baseSize;
        const chunk = work.slice(start, start + size);
        result.push({
            start_index: start,
            end_index: start + size - 1,
            thread_progress: {current: 0},
            result: chunk,
        });
        start += size;
    }

    return result;
}

const start_download_thread = async ({thread_index, start_index, main_dir, pause_download_task, thread_progress, segments, max_segment_count}:any)=>{
    try {
        const segment_dir = await path.join(main_dir, "segment");
        const download_manifest_path = await path.join(main_dir, `download_manifest_${thread_index}.json`);
        

        let download_manifest_data = {segment_index:-1};
        try{
            if (await exists(download_manifest_path)) {
                download_manifest_data = JSON.parse(await readTextFile(download_manifest_path, {baseDir:BaseDirectory.AppData}));
            }
        }catch(e){
            console.error(e);
        }

        const result_segments:string[] = [];
        for (let [index, segment] of segments.entries()) {
            if (work_status.code !== 200) {
                return {code:work_status.code, message:"PAUSED"};
            }
            

            if (pause_download_task.current) {
                work_status.code = 410;
                work_status.message = "PAUSED";
                return work_status;
            }
            

            const segment_path = await path.join(segment_dir,`segment-${start_index+index}`)
            
            
            
            if (index > download_manifest_data.segment_index ) {
                let retry = 0
                while (true){
                    const download_result = await download_file_in_chunks({url: segment.uri, output_file: segment_path,
                        callback: ({current_size,total_size}:any) => {
                            
                            thread_progress.current = index+(current_size/total_size)
                        }

                    });
                    if (download_result.code === 200) {
                        result_segments.push(segment_path);
                        break;
                    }else if (retry >= 3) {
                        console.error(`[Download Task] Failed to download segment after ${retry} retries`);
                        // await remove(main_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e) => { console.error(e) });
                        await write_crash_log(`[Download Task] Failed to download segment after ${retry} retries`);
                        // await write_crash_log(`Directory: ${main_dir} -> will be removed`);
                        
                        work_status.code = 500;
                        work_status.message = "Failed to download segment after 3 retries";
                        return work_status;
                    };
                    retry++
                }
                
                download_manifest_data.segment_index = index;
                await writeTextFile(download_manifest_path, JSON.stringify(download_manifest_data), {baseDir:BaseDirectory.AppData, create: true}).catch((e) => { console.error(e) });
            }else{
                result_segments.push(segment_path);
            }

            thread_progress.current = index+1;
        }

        await remove(download_manifest_path, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});

        return {code:200, message:"Success", segments:result_segments}
    }catch(e:any){
        work_status.code = 500;
        work_status.message = e;
        
        console.error(`Error at start_download_thread : ${thread_index}`, e)
        console.error("Error message:", e.message);
        console.error("Stack trace:", e.stack);
        await write_crash_log(`[Download Task] Error at start_download_thread : ${thread_index}\nError message: ${e.message}\nStack trace: ${e.stack}`);
        return work_status;
    }
}


const manage_download = async ({hls_data,main_dir, pause_download_task, download_task_progress}:{hls_data:string,main_dir:string, pause_download_task:any, download_task_progress:any})=>{
    // Parse the M3U8 content
    try{
        const config_manifest = await read_config();
        const max_thread = config_manifest.max_download_thread;
        
        work_status.code = 200;

        const segment_dir = await path.join(main_dir, "segment");
        const parser = new Parser();
        parser.push(hls_data);
        parser.end();
        const parsedManifest = parser.manifest;

        const max_segment_count = parsedManifest.segments.length;
        await mkdir(segment_dir, { recursive: true, baseDir: BaseDirectory.AppData }).catch((e) => { console.error(e) });


        // Replace segment URIs with full URLs
        const work_chunks = split_work(parsedManifest.segments, max_thread);
        console.log(work_chunks);
        const tasks: Promise<any>[] = [];

        for (let i = 0; i < max_thread; i++) {

            const { start_index, result, thread_progress } = work_chunks[i];
            const task = start_download_thread({
                thread_index: i,
                start_index,
                main_dir,
                pause_download_task,
                thread_progress,
                segments:result,
                max_segment_count,
            });

            tasks.push(task);
        }

        const update_task_progress_interval = setInterval(() => {
            let progress:number = 0;
            for (let i = 0; i < max_thread; i++) {
                progress += work_chunks[i].thread_progress.current;
            }
            download_task_progress.current = {status: "downloading", percent:(progress/max_segment_count)*100, label:`${Math.round(progress * 100) / 100}/${max_segment_count}`};
        },1000)

        const task_result = await Promise.all(tasks);
        console.log("IT DONNEEE FAST SO FAST????")

        clearInterval(update_task_progress_interval);

        const result_segments:string[] = [];
        for (const result of task_result) {
            if (result.code !== 200) {
                console.error(result.message);
                return result
            }else{
                result_segments.push(...result.segments);
            }
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

        parsedManifest.segments.forEach((segment, index) => {
            outputdata += `#EXTINF:${segment.duration},\n${result_segments[index]}\n`;
        });

        if (parsedManifest.endList) outputdata += `#EXT-X-ENDLIST\n`;

        const output_file = await path.join(main_dir, "player.m3u8")
        await writeTextFile(output_file, outputdata, {baseDir:BaseDirectory.AppData, create:true}).catch((e)=>{console.error(e)});
        

        return {code:200, message:"OK", result: output_file}
    }catch(e:any){
        console.error("Error at manage_download: ", e)
        console.error("Error message:", e.message);
        console.error("Stack trace:", e.stack);
        return {code:500, message:e}
    }
}

export default manage_download;