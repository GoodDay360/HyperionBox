import { path } from '@tauri-apps/api';
import { platform } from '@tauri-apps/plugin-os';

const get_npm_path = new Promise <string|undefined>(async (resolve, reject)=>{
    const plat = await platform()
    // const ar = await arch()
    const path_node_dir = await path.join(await path.appDataDir(), "bin" ,"node")
    if (plat === "windows"){
        resolve(await path.join(path_node_dir, "npm.cmd"))
    }else{
        reject("Unsupport system.");
        console.error("Unsupport system.")
    }
})

export default get_npm_path;