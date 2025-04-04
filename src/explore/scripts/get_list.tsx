// Tauri Imports
// Axios Imports
import axios from 'axios';

// Custom Imports
import { read_config } from "../../global/scripts/manage_config";

const get_list = async ({source_id, search}:{source_id:string,search:string}) => {
    return await new Promise<any>(async (resolve, reject) => {
        const port = sessionStorage.getItem("extension_port");
        const config = await read_config();
        const body = {
            "browser_path": config.bin.browser_path,
            "source_id": source_id,
            "method": "get_list",
            "search": search,
        }
        axios({
            method: 'POST',
            url: `http://localhost:${port}/request_extension`,
            data: body,
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((res: any) => {
            resolve(res.data);
        }).catch((e: any) => {
            reject({ code: 500, message: e });
        });
    })
}

export default get_list;