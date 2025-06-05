import { platform, arch } from '@tauri-apps/plugin-os';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readDir, exists, remove, mkdir, readFile} from '@tauri-apps/plugin-fs';

// import JSZip from 'jszip';
import get_7z_path from '../../global/scripts/get_7z_path';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import execute_command from '../../global/scripts/excute_command';
import get_npm_path from '../../global/scripts/node/get_npm_path';
import write_crash_log from '../../global/scripts/write_crash_log';


const chunkSize = 6 * 1024 * 1024; 

const check_extension_package = async ({manifest, setFeedback, setProgress}:any) => {
    try{
        const url = manifest?.["extension-package"]?.[await platform()]?.[await arch()]?.url;
        console.log(url)
        if (!url) {
            setFeedback("Your system doesn't support this app.")
            return {code:500, message:"System not support."};
        }
        
        const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app")
        await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})
        const output_file = await path.join(temp_dir, `extension_package.zip`)

        let start_size = 0;
        if (await exists(output_file)) {
            const file = await readFile(output_file, {baseDir:BaseDirectory.Temp});
            start_size = file.byteLength;
        }
        setFeedback({text:"Downloading extension_package..."})

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
        
        setFeedback({text:"Cleaning up..."})
        const extract_dir = await path.join(await path.appDataDir(),"extension")
        await mkdir(extract_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)})
        const entries = await readDir(extract_dir, { baseDir: BaseDirectory.AppData });

        for (const entry of entries) {
            console.log(entry);
            if (entry.isDirectory && !["sources","log"].includes(entry.name)) {
                await remove(await path.join(extract_dir, entry.name), {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)})
            }
        }

        setFeedback({text:"Extracting extension_package..."})
        const path_7z = await get_7z_path;
        
        const command = `"${path_7z}" x "${output_file}" -o"${extract_dir}" -aoa -md=32m -mmt=3`
        const result = await execute_command({title:"extract",command:command})


        if (result.stderr) {
            await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)});
            return {code:500, message:result.stderr, at:"check_extension_package.tsx -> excute_command -> extract"}
        };


        if (await exists(output_file)) await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true});

        const npm_path = await get_npm_path;
        setFeedback({text:`Installing extension packages... might take a while.`})
        const execute_install_npm_response = await execute_command({title:"npm-install",command:`"${npm_path}" install`,cwd:extract_dir})
        if (execute_install_npm_response.stderr.trim()) {
            await write_crash_log(`[check_extension_packages] npm install: ${JSON.stringify({code: 500, message: execute_install_npm_response.stderr})}`);
            return {code: 500, message: execute_install_npm_response.stderr};
        }

        return {code: 200, message: 'OK'}
        
    }catch(e:any){
        console.error("[Error] check_extension_package: ", e);
        return {code:500, message:e};
    }
}

export default check_extension_package;