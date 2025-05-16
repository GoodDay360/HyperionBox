import { path } from '@tauri-apps/api';
import { platform } from '@tauri-apps/plugin-os';

const get_yt_dlp_path = new Promise <string>(async (resolve, reject)=>{
    const plat = await platform()
    // const ar = await arch()
    const bin_dir = await path.join(await path.appDataDir(), "bin")
    if (plat === "windows"){
        const yt_dlp_path = await path.join(bin_dir, "yt-dlp.exe")
        resolve(yt_dlp_path);
    }else{
        reject("Unsupport system");
        console.error("Unsupport system")
    }
})

export default get_yt_dlp_path;