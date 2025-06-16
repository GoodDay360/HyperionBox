import { platform, arch } from '@tauri-apps/plugin-os';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readDir, exists, remove, mkdir, readFile} from '@tauri-apps/plugin-fs';

// import JSZip from 'jszip';
import get_7z_path from '../../global/scripts/get_7z_path';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import execute_command from '../../global/scripts/execute_command';
import copy_recursive from '../../global/scripts/copy_recursive';

const chunkSize = 6 * 1024 * 1024; 

const check_ffmpeg = async ({manifest, setFeedback, setProgress}:any) => {
    try{
        const url = manifest?.["ffmpeg"]?.[await platform()]?.[await arch()]?.url;
        if (!url) {
            setFeedback("Your system doesn't support this app.")
            return {code:500, message:"System not support."};
        }
        
        const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app")
        await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})
        const output_file = await path.join(temp_dir, `ffmpeg.zip`)

        let start_size = 0;
        if (await exists(output_file)) {
            const file = await readFile(output_file, {baseDir:BaseDirectory.Temp});
            start_size = file.byteLength;
        }
        setFeedback({text:"Downloading ffmpeg..."})

        await download_file_in_chunks({
            url, 
            start_size,
            chunk_size:chunkSize, 
            output_file:output_file,
            callback: ({current_size,total_size}:any) => {
                setProgress({state:true,value:current_size*100/total_size})

            }
        });

        setProgress({state:false,value:0})

        setFeedback({text:"Extracting ffmpeg..."})
        
        const path_7z = await get_7z_path;
        const bin_dir = await path.join(await path.appDataDir(),"bin")
        const extract_dir = await path.join(bin_dir,"ffmpeg")
        if (await exists(extract_dir)) await remove(extract_dir, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)})

        const command = `"${path_7z}" x "${output_file}" -o"${extract_dir}" -ir!ffmpeg-master*/ -aoa -md=32m -mmt=3`;
        const result = await execute_command({title:"extract",command:command});
        if (result.stderr) {
            await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)});
            return {code:500, message:result.stderr, at:"check_ffmpeg.tsx -> excute_command -> extract"}
        };
        
        const extract_response = await new Promise<any>(async (resolve,reject)=>{
            const entries = await readDir(extract_dir,{baseDir:BaseDirectory.AppData});
            const ffmpeg_folder_name:any = entries.find(entr => entr.name.startsWith('ffmpeg-master'));

            const extracted_ffmpeg_dir = await path.join(extract_dir, ffmpeg_folder_name.name);
            
            await copy_recursive({src:extracted_ffmpeg_dir, dest:extract_dir})
            .catch((e)=>{
                reject({code:500, message:e})
                console.error("[Error] copy_recursive:", e);
            })

            await remove(extracted_ffmpeg_dir,{baseDir:BaseDirectory.AppData, recursive:true})
            .catch((e)=>{
                reject({code:500, message:e})
                console.error("[Error] remove:", e);
            })
            resolve({code:200, message:"OK"})
        })
        if (await exists(output_file)) await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true})
        if (extract_response.code !== 200) return extract_response;

        return {code: 200, message: 'OK'}
    }catch(e:any){
        console.error("[Error] check_ffmpeg: ", e);
        return {code:500, message:e};
    }
}

export default check_ffmpeg;