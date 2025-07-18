import { path } from '@tauri-apps/api';
import { platform } from '@tauri-apps/plugin-os';

const get_node_dir = new Promise <string|undefined>(async (resolve, _)=>{
    const plat = await platform()
    // const ar = await arch()
    const path_node_dir = await path.join(await path.appDataDir(), "bin" ,"node")
    if (plat === "windows"){
        resolve(path_node_dir);
    }else{
        resolve(await path.join(path_node_dir, "bin"))
    }
})

export default get_node_dir;