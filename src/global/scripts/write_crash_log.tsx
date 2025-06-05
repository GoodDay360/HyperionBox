import { path } from '@tauri-apps/api';
import { BaseDirectory, mkdir, writeTextFile, remove, exists} from '@tauri-apps/plugin-fs';
import dayjs from 'dayjs';
let first_launch = true
const write_crash_log = async (log:string) => {
    return await new Promise<any>(async (resolve, reject) => {
        const LOG_DIR = await path.join(await path.appDataDir(), "log");
        const log_file_path = await path.join(LOG_DIR,"crash.log");
        if (!await exists(LOG_DIR)) await mkdir(LOG_DIR, {baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});
        if (first_launch) {
            if (await exists(log_file_path)) {
                await remove(log_file_path, {baseDir:BaseDirectory.AppData,recursive:true})
                .catch(e=>{
                    reject({code:500, message:e});
                    console.error(e)
                });
            }
        }
        first_launch = false
        const currentTime = dayjs().format('DD-MM-YYYY | hh:mm:ss A');
        writeTextFile(log_file_path, `[${currentTime}]: ${log}\n`, {baseDir:BaseDirectory.AppData, append:true, create:true})
        .then(()=>{resolve({code:200, message:"OK"})})
        .catch(e=>{
            reject({code:500, message:e});
            console.error(e)
        });
        
    })
    
}

export default write_crash_log;