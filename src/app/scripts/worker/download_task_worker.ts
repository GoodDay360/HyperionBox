
import axios from 'axios';

// Custom Imports
import { read_config } from "../../../global/scripts/manage_config";
import { request_current_task, request_download_task } from "../../../global/scripts/manage_download";

const get_download_info = async ({source_id, search}:{source_id:string,search:string}) => {
    return await new Promise<any>(async (resolve, reject) => {
        const port = sessionStorage.getItem("extension_port");
        const body = {
            "source_id": source_id,
            "search": search,
        }
        axios({
            method: 'POST',
            url: `http://localhost:${port}/request_download_info`,
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

const download_task_worker = async ()=>{
    // while (true){
        const request_download_task_result:any = await request_download_task();
        if (request_download_task_result.code === 200){
            for (const main_data of request_download_task_result.data){
                const source_id = main_data.source_id;
                const season_id = main_data.season_id;
                const preview_id = main_data.preview_id;
                const type_schema = main_data.type_schema;
                for (const data of main_data.data){
                    console.log(data)
                    // const download_info_result = await get_download_info()
                }
            
            }
        }else{
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        // await new Promise(resolve => setTimeout(resolve, 1000));
    // }
}

export default download_task_worker;
