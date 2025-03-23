import execute_command from "../../global/scripts/excute_command";
import get_node_path from "../../global/scripts/node/get_node_path";
import get_extension_directory from "../../global/scripts/get_extension_directory";

// Tauri Imports
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';

// Custom Imports


const get_preview = async ({source_id,preview_id}:{source_id:string,preview_id:string}) => {
    return await new Promise<any>(async (resolve, reject) => {
        const LOG_DIR = await path.join(await path.appDataDir(), "log", "extension")
        const command = [
            `"${await get_node_path}"`, `"${await path.join(await get_extension_directory, "route.js")}"`,
            "--source", `"${source_id}"`,
            "--method", '"get_preview"',
            "--log_output_dir", `"${LOG_DIR}"`
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

export default get_preview;