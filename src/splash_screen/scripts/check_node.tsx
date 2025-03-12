import { info } from '@tauri-apps/plugin-log';
import { platform, arch } from '@tauri-apps/plugin-os';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readDir, exists, remove, mkdir} from '@tauri-apps/plugin-fs';

// import JSZip from 'jszip';
import get_7z_path from '../../global/script/get_7z_path';
import download_file_in_chunks from '../../global/script/download_file_in_chunk';
import execute_command from '../../global/script/excute_command';
import copy_recursive from '../../global/script/copy_recursive';

const chunkSize = 6 * 1024 * 1024; 

const check_node = async ({manifest, setFeedback, setProgress}:any) => {
    info(await arch() + await platform())

    try{
        const url = manifest?.["node"]?.[await platform()]?.[await arch()];
        if (!url) {
            setFeedback("Your system doesn't support this app.")
            return {code:500, message:"System not support."};
        }
        
        const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app")
        await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})
        const output_file = await path.join(temp_dir, `node.zip`)

        if (await exists(output_file)) await remove(output_file, {baseDir:BaseDirectory.Temp})
        setFeedback({text:"Downloading node..."})

        await download_file_in_chunks({
            url: url, chunkSize:chunkSize, output_file:output_file,
            callback: ({current_size,total_size}:any) => {
                setProgress({state:true,value:current_size*100/total_size})

            }
        });

        setProgress({state:false,value:0})

        setFeedback({text:"Extracting node..."})
        
        const path_7z = await get_7z_path as string;
        const bin_dir = await path.join(await path.appDataDir(),"bin")
        const extract_dir = await path.join(bin_dir,"node")
        if (await exists(extract_dir)) await remove(extract_dir, {baseDir:BaseDirectory.Temp})

        const command = `"${path_7z}" x "${output_file}" -o"${extract_dir}" -ir!node-*/ -aoa -md=32m -mmt=6`
        const result = await execute_command({title:"extract",command:command})
        console.log("info",result.stdout)
        console.log("error",result.stderr)
        
        const extract_response = await new Promise<any>(async (resolve,reject)=>{
            const entries = await readDir(extract_dir,{baseDir:BaseDirectory.AppData})
            const node_folder_name:any = entries.find(entr => entr.name.startsWith('node-'));

            const extracted_node_dir = await path.join(extract_dir, node_folder_name.name);
            
            await copy_recursive({src:extracted_node_dir, dest:extract_dir})
            .catch((e)=>{
                reject({code:500, message:e})
                console.error("[Error] copy_recursive:", e);
            })

            await remove(extracted_node_dir,{baseDir:BaseDirectory.AppData, recursive:true})
            .catch((e)=>{
                reject({code:500, message:e})
                console.error("[Error] remove:", e);
            })
            resolve({code:200, message:"OK"})
        })
        if (extract_response.code !== 200) return extract_response;

        return {code: 200, message: 'OK'}
    }catch{(e:unknown)=>{
        console.error("[Error] check_node: ", e);
        return {code:500, message:e};
    }}
}

export default check_node;