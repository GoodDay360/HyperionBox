import execute_command from "../../global/script/excute_command";
import get_node_path from "../../global/script/get_node_path";
import get_extension_directory from "../../global/script/get_extension_directory";

// Tauri Imports
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';

// Custom Imports
import { get_installed_sources } from "../../global/script/manage_extension_sources";

const get_list = async ({source_id, search}:{source_id:string,search:string}) => {
    return await new Promise<any>(async (resolve, reject) => {
        const LOG_DIR = await path.join(await path.appDataDir(), "log", "extension")
        const command = [
            `"${await get_node_path}"`, `"${await path.join(await get_extension_directory, "route.js")}"`,
            "--source", `"${source_id}"`,
            "--method", '"get_list"',
            "--search", `"${search}"`,
            "--log_output_dir", LOG_DIR
        ].join(" ")

        const excute_result = await execute_command({command:command, title:"get_list"})
        if (excute_result.stderr){
            reject({code:500, message:excute_result.stderr});
        }else{
            readTextFile(await path.join(LOG_DIR, "get_list_result.json"), {baseDir:BaseDirectory.AppData})
            .then((res) => {
                try{    
                    const result = JSON.parse(res)
                    if (result.status.code !== 200) {
                        reject({code:500, message:`[Error] Failed to get list for source ${source_id}`});
                    }else{
                        resolve({code:200, message:"OK", response:result});
                    }
                }catch(e){
                    reject({code:500, message:e});
                }
            })
        }
        
    })
}

export default get_list;