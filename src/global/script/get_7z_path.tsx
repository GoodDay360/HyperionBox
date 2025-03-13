import { path } from '@tauri-apps/api';
import { platform } from '@tauri-apps/plugin-os';

const get_7z_path = new Promise <string>(async (resolve, reject)=>{
    const plat = await platform()
    // const ar = await arch()
    const path_7z_dir = await path.join(await path.appDataDir(), "bin" ,"7z")
    if (plat === "windows"){
        resolve(await path.join(path_7z_dir, "7za.exe"))
    }else{
        reject("Unsupport system");
        console.error("Unsupport system")
    }
})

export default get_7z_path;