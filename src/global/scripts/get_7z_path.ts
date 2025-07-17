import { path } from '@tauri-apps/api';
import { platform } from '@tauri-apps/plugin-os';

const get_7z_path = new Promise <string>(async (resolve, _)=>{
    const plat = await platform()
    // const ar = await arch()
    const path_7z_dir = await path.join(await path.appDataDir(), "bin" ,"7z")
    if (plat === "windows"){
        resolve(await path.join(path_7z_dir, "7za.exe"))
    }else{
        const path_7z = await path.join(path_7z_dir, "7zzs")
        resolve(path_7z);
    }
})

export default get_7z_path;