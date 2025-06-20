

// Axios Imports
import axios from 'axios';

// Tauri Imports


// Dayjs Imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

const open_external = async ({source_id,season_id="0",preview_id,watch_id}:{
    source_id:string,
    season_id?:string,
    preview_id:string,
    watch_id:string
}) => {
    return await new Promise<any>(async (resolve, _) => {
        
        const port = sessionStorage.getItem("extension_port");
        const body = {
            source_id,
            season_id,
            preview_id,
            watch_id,
        }
        axios({
            method: 'POST',
            url: `http://localhost:${port}/request_open_external`,
            data: body,
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(() => {
            
        }).catch((e: any) => {
            console.log(e)
            resolve({ code: 500, message: e });
        });
        
    })
}

export default open_external;