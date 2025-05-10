
import axios from 'axios';

// Custom Imports
import { read_config } from "../../../global/scripts/manage_config";
import { request_current_task, request_download_task } from "../../../global/scripts/manage_download";
import get_download_info from './get_download_info';
import { download_task_context } from '../../../global/scripts/contexts';

const download_task_worker = async ({set_download_task_info,set_download_task_progress}:any)=>{
    
    // while (true){
        const request_download_task_result:any = await request_download_task();
        if (request_download_task_result.code === 200){
            for (const main_data of request_download_task_result.data){
                const source_id = main_data.source_id;
                const season_id = main_data.season_id;
                const preview_id = main_data.preview_id;
                for (const data of main_data.data){
                    // const download_info_result = await get_download_info({source_id,preview_id,watch_id:data.watch_id})
                    set_download_task_info({source_id,season_id,preview_id,watch_id:data.watch_id,watch_index:data.watch_index,watch_title:data.title})
                    break;
                }
                break;
            }
        }else{
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    // }
}

export default download_task_worker;
