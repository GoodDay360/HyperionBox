

// Axios Imports
import axios from 'axios';

// Tauri Imports
import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';
import { read_config } from "../../global/scripts/manage_config";

// Custom Imports
import execute_command from "../../global/scripts/excute_command";
import get_node_path from "../../global/scripts/node/get_node_path";
import get_extension_directory from "../../global/scripts/get_extension_directory";


const get_preview = async ({source_id,preview_id}:{source_id:string,preview_id:string}) => {
    return await new Promise<any>(async (resolve, reject) => {
        const port = sessionStorage.getItem("extension_port");
        const config = await read_config();
        const body = {
            "browser_path": config.bin.browser_path,
            "source": source_id,
            "method": "get_preview",
            "preview_id": preview_id,
        }
        console.log(`http://localhost:${port}/request_extension`)
        // axios({
        //     method: 'POST',
        //     url: `http://localhost:${port}/request_extension`,
        //     data: body,
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        // }).then((res: any) => {
        //     resolve(res.data);
        //     console.log(res.data);
        // }).catch((e: any) => {
        //     reject({ code: 500, message: e });
        // });

        readTextFile(await path.join(await path.appDataDir(), "log", "extension", "get_preview_result.json"), {baseDir:BaseDirectory.AppData})
        .then((res) => {resolve(JSON.parse(res))})
        .catch((e) => {reject({ code: 500, message: e });});
        
    })
}

export default get_preview;