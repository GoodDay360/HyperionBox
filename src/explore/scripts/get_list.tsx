import execute_command from "../../global/script/excute_command";
import get_node_path from "../../global/script/get_node_path";
import get_extension_directory from "../../global/script/get_extension_directory";

// Tauri Imports
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';

// Custom Imports
import { get_installed_sources } from "../../global/script/manage_extension_sources";

const get_list = async () => {
    return await new Promise<any>(async (resolve, reject) => {
        const source_list = await get_installed_sources()

        const DATA:any = {}
        for (const source of source_list.data){
            console.log(await get_extension_directory)
            const LOG_DIR = await path.join(await path.appDataDir(), "log", "extension")
            const command = [
                `"${await get_node_path}"`, `"${await path.join(await get_extension_directory, "route.js")}"`,

                "--source", `"${source.title}"`,
                "--method", '"get_list"',
                "--search", '"IDOLiSH7 Vibrato"',
                "--log_output_dir", LOG_DIR
            ].join(" ")

            const result = await execute_command({command:command, title:"get_list"})
            if (result.stderr){
                DATA[source.title] = {code:500, message:result.stderr};
            }else{
                readTextFile(await path.join(LOG_DIR, "get_list_result.json"), {baseDir:BaseDirectory.AppData})
                .then((res) => {
                    try{    
                        const result = JSON.parse(res)
                        if (result.status.code !== 200) {
                            DATA[source.title] = {code:500, message:`[Error] Failed to get list for source ${source.title}`};
                        }else{
                            DATA[source.title] = {code:200, message:"OK", response:result};
                        }
                        
                    }catch(e){
                        DATA[source.title] = {code:500, message:e};
                    }
                })
            }
        }
        resolve(DATA)
    })
}

export default get_list;