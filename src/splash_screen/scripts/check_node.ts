import { platform, arch } from '@tauri-apps/plugin-os';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readDir, exists, remove, mkdir, readFile} from '@tauri-apps/plugin-fs';

// import JSZip from 'jszip';
import get_7z_path from '../../global/scripts/get_7z_path';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import execute_command from '../../global/scripts/execute_command';

const chunkSize = 6 * 1024 * 1024; 

const check_node = async ({manifest, setFeedback, setProgress}:any) => {
    try{
        const url = manifest?.["node"]?.[await platform()]?.[await arch()]?.url;
        if (!url) {
            setFeedback("Your system doesn't support this app.")
            return {code:500, message:"System not support."};
        }
        
        const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app")
        await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})
        const output_file = await path.join(temp_dir, `node.zip`)

        let start_size = 0;
        if (await exists(output_file)) {
            const file = await readFile(output_file, {baseDir:BaseDirectory.Temp});
            start_size = file.byteLength;
        }
        setFeedback({text:"Downloading node..."})

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

        setFeedback({text:"Extracting node..."})
        
        const path_7z = await get_7z_path;
        const bin_dir = await path.join(await path.appDataDir(),"bin")
        const extract_dir = await path.join(bin_dir,"node")
        if (await exists(extract_dir)) await remove(extract_dir, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)})
        await mkdir(extract_dir, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)})

        const command = await platform() === 'windows'
        ? `"${path_7z}" x "${output_file}" -o"${extract_dir}" -ir!node-v*/ -aoa`
        : `"${path_7z}" x "${output_file}" -so | "${path_7z}" x -aoa -si -ttar -o"${extract_dir}"`;
        const result = await execute_command({title:"extract",command:command})
        if (result.stderr) {
            await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)});
            return {code:500, message:result.stderr, at:"check_node.tsx -> excute_command -> extract"}
        };

        const entries = await readDir(extract_dir,{baseDir:BaseDirectory.AppData})
        const node_folder_name:any = entries.find(entr => entr.name.startsWith('node-v'));

        const extracted_node_dir = await path.join(extract_dir, node_folder_name.name);


        if (await platform() === 'windows'){
            const command = `robocopy . "${extract_dir}" /E /COPY:DATS /MT:3 /R:0 /W:0 /NFL /NDL`
            const copy_result = await execute_command({title:"copy_recursive",command,cwd:extracted_node_dir})
            if (copy_result.stderr) {
                return {code: 500, message: copy_result.stderr}
            }
        }else{
            
            const copy_result = await execute_command({title:"copy_recursive",command:`cp -r . "${extract_dir}"`,cwd:extracted_node_dir})
            if (copy_result.stderr) {
                return {code: 500, message: copy_result.stderr}
            }

            
            const execute_result = await execute_command({title:"node_chmod",command:`chmod -R u+rx ${await path.join(extract_dir, 'bin')}`, wait:true, spawn:false});
            if (execute_result.stderr) {
                return {code:500, message:execute_result.stderr};
            }
            
        }

        await remove(extracted_node_dir,{baseDir:BaseDirectory.AppData, recursive:true})
        .catch((e)=>{
            console.error("[Error] remove:", e);
            return {code:500, message:e}
        })

        if (await exists(output_file)) await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true})
        
        return {code: 200, message: 'OK'}
    }catch(e){
        console.error("[Error] check_node: ", e);
        return {code:500, message:e};
    }
}

export default check_node;