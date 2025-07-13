// Tauri Plugins
import { path } from '@tauri-apps/api';
import { exists, remove, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';
import { platform } from '@tauri-apps/plugin-os';

// Custom Imports
import { add_source } from "../../global/scripts/manage_extension";
import get_7z_path from "../../global/scripts/get_7z_path";
import get_extension_directory from "../../global/scripts/get_extension_directory";
import execute_command from '../../global/scripts/execute_command';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import write_crash_log from '../../global/scripts/write_crash_log';


const install_source = async ({id,url,domain,icon,title,description,version}
:{
    id: string,
    url: string,
    domain: string,
    icon: string,
    title: string,
    description: string,
    version: string
}) => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_USE_CUSTOM_EXTENSIONS_DIRECTORY === "1") {
        const message = "Unable to install. To prevent source code modification, this action is canceled because you're using custom extension directory."
        console.log(message);
        return {code:403, message};
    }
    const extension_dir = await get_extension_directory;
    const sources_dir = await path.join(extension_dir, "sources", id);
    

    if (!await exists(sources_dir)) {
        await mkdir(sources_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});
    }

    const path_7z = await get_7z_path;

    const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app", "source")
    await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})
    const zip_file = await path.join(temp_dir, `${id}.zip`)

    await download_file_in_chunks({url:url, output_file: zip_file})
    
    let command

    if (await platform() === "windows") {
        command = `& "${path_7z}" x "${zip_file}" -o"${sources_dir}" -aoa -md=32m -mmt=3`
    }else{
        command = `"${path_7z}" x "${zip_file}" -o"${sources_dir}" -aoa -md=32m -mmt=3`
    }

    const result = await execute_command({title:`extract_source_${id}`,command:command})
    if (result.stderr) {
        await remove(zip_file, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)});
        await write_crash_log(`[Error] install_source -> ${id} -> extract\n${result.stderr}\n`);
        return {code:500, message:result.stderr, at:`install_source -> ${id} -> extract`}
    };
    await remove(zip_file, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)});


    const add_source_result = await add_source({id,domain,icon,title,description,version});
    
    if (add_source_result.code == 200){
        return {code:200, message:"Success"};
    }else{
        await write_crash_log(`[Error] install_source -> ${id} -> add_source\n${add_source_result.message}\n`);
        return {code:add_source_result.code || 500, message:add_source_result.message};
    }
}

export default install_source;