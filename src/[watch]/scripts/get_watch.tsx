

// Axios Imports
import axios from 'axios';

// Tauri Imports
import { read_config } from "../../global/scripts/manage_config";
import { path } from '@tauri-apps/api';
import { exists, writeTextFile, mkdir, BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

// Dayjs Imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

// Custom Imports


const FETCH_UPDATE_INTERVAL = 6; // In hours

const get_watch = async ({source_id,preview_id,watch_id,server_type,server_id,force_update=false}:{
    source_id:string,preview_id:string,
    watch_id:string,server_type:string|null,server_id:string|null,
    force_update?:boolean
}) => {
    return await new Promise<any>(async (resolve, _) => {
        try{
                
            const cache_dir = await path.join(await path.appDataDir(), ".cache", "watch", source_id, preview_id, watch_id);
            const manifest_path = await path.join(cache_dir, "manifest.json")
            if (!force_update && await exists(manifest_path)) {
                try {
                    const manifest_data = JSON.parse(await readTextFile(manifest_path, {baseDir:BaseDirectory.AppData}));
                    if (dayjs.utc().unix() - (manifest_data.last_update??0) <= FETCH_UPDATE_INTERVAL * 60 * 60) {
                        resolve({code:200,result:manifest_data});
                        return;
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            const port = sessionStorage.getItem("extension_port");
            const config = await read_config();
            const body = {
                "browser_path": config.bin.browser_path,
                "cache_dir": await path.join(await path.appDataDir(), ".cache"),
                "method": "get_watch",
                "source_id": source_id,
                "preview_id": preview_id,
                "watch_id": watch_id,
                "server_type": server_type,
                "server_id": server_id
            }
            axios({
                method: 'POST',
                url: `http://localhost:${port}/request_extension`,
                data: body,
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(async (res: any) => {
                
                if (!await exists(cache_dir)) await mkdir(cache_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)})
                res.data.result.last_update = dayjs().utc().unix();
                await writeTextFile(manifest_path, JSON.stringify(res.data.result), {baseDir:BaseDirectory.AppData, create:true}).catch((e)=>{console.error(e)});
                resolve(res.data);
            }).catch((e: any) => {
                resolve({ code: 500, message: e });
            });        
        }catch(e: any) {
            console.error(e);
            resolve({ code: 500, message: e });
        }
    })
}

export default get_watch;