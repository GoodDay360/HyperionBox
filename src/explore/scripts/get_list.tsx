// Tauri Imports

// Axios Imports
import axios from 'axios';

// Custom Imports


const get_list = async ({source_id, search, page=1}:{source_id:string,search:string,page?:number}) => {
    return await new Promise<any>(async (resolve, _) => {
        const port = sessionStorage.getItem("extension_port");
        const body = {
            "source_id": source_id,
            "method": "get_list",
            "search": search,
            page
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
            resolve({ code: 500, message: e?.message });
        });
    })
}

export default get_list;