import { path } from '@tauri-apps/api';
import { platform } from '@tauri-apps/plugin-os';

const get_ffmpeg_bin = new Promise <string>(async (resolve, reject)=>{
    const plat = await platform()
    // const ar = await arch()
    const path_ffmpeg_dir = await path.join(await path.appDataDir(), "bin" ,"ffmpeg")
    if (plat === "windows"){
        resolve(await path.join(path_ffmpeg_dir, "bin"))
    }else{
        reject("Unsupport system");
        console.error("Unsupport system")
    }
})

export default get_ffmpeg_bin;