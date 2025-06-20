

// Axios Imports
import axios from 'axios';

// Tauri Imports
import { read_config } from "../../global/scripts/manage_config";

// Custom Imports



const get_preview = async ({source_id,preview_id}:{source_id:string,preview_id:string}) => {
    return await new Promise<any>(async (resolve, _) => {
        const port = sessionStorage.getItem("extension_port");
        const config = await read_config();
        const body = {
            "browser_path": config.bin.browser_path,
            "source_id": source_id,
            "method": "get_preview",
            "preview_id": preview_id,
        }
        console.log(`http://localhost:${port}/request_extension`)
        axios({
            method: 'POST',
            url: `http://localhost:${port}/request_extension`,
            data: body,
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((res: any) => {
            resolve(res.data);
            console.log(res.data);
        }).catch((e: any) => {
            console.log(e)
            resolve({ code: 500, message: e });
        });

    })
}

export default get_preview;