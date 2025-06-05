import { platform, arch } from '@tauri-apps/plugin-os';

import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, mkdir, readFile} from '@tauri-apps/plugin-fs';


import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import write_crash_log from '../../global/scripts/write_crash_log';


const chunkSize = 6 * 1024 * 1024; 

const check_yt_dlp = async ({manifest, setFeedback, setProgress}:any) => {

    try{
        const url = manifest?.["yt-dlp"]?.[await platform()]?.[await arch()]?.url;
        if (!url) {
            setFeedback("Your system doesn't support this app.")
            return {code:500, message:"System not support."};
        }
        setFeedback({text:"Downloading YT-DLP..."})
        const bin_dir = await path.join(await path.appDataDir(),"bin")
        if (!await exists(bin_dir, {baseDir:BaseDirectory.AppData})) await mkdir(bin_dir, {baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});
        
        if (await platform() === "windows"){
            const output_file = await path.join(bin_dir, "yt-dlp.exe")
            let start_size = 0;
            if (await exists(output_file)) {
                const file = await readFile(output_file, {baseDir:BaseDirectory.Temp});
                start_size = file.byteLength;
            
            }
            await download_file_in_chunks({
                url, 
                start_size,
                chunk_size:chunkSize, 
                output_file:output_file,
                callback: ({current_size,total_size}:any) => {
                    setProgress({state:true,value:current_size*100/total_size})

                }
            });
        }
        
        setProgress({state:false,value:0})

        return {code: 200, message: 'OK'}
    }catch(e:any){
        console.error("[Error] check_YT-DLP: ", e);
        write_crash_log(`[Error] check_YT-DLP: ${JSON.stringify(e)}`)
        return {code:500, message:e};
    }
}

export default check_yt_dlp;