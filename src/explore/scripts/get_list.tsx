// Tauri Imports
import { path } from '@tauri-apps/api';
import { fetch } from '@tauri-apps/plugin-http';

// Custom Imports
import { read_config } from "../../global/scripts/manage_config";
import get_node_path from "../../global/scripts/node/get_node_path";
import get_extension_directory from "../../global/scripts/get_extension_directory";

const get_list = async ({source_id, search}:{source_id:string,search:string}) => {
    return await new Promise<any>(async (resolve, reject) => {
        const config = await read_config();
        const body = {
            "browser_path": config.bin.browser_path,
            "source": source_id,
            "method": "get_list",
            "search": search,
        }
        
        fetch('https://api.example.com/data', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
            'Content-Type': 'application/json',
            },
        }).then((res:any) => {
            console.log(res.json())
            resolve(res.json());
        }).catch((e:any) => {
            reject({code:500, message:e});
        })
    })
}

export default get_list;