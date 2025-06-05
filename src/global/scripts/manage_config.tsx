import { exists,  readTextFile, writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';

export const read_config = async () =>{
    await mkdir(await path.appDataDir(), {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
    const config_path = await path.join(await path.appDataDir(),"config.json")
    const file_exist = await exists(config_path);
    if (!file_exist) {
        await writeTextFile(config_path, "{}")
        return {}
    }else {
        const res = await readTextFile(config_path);
        let config
        try{
            config = JSON.parse(res)
        }catch{
            await writeTextFile(config_path, "{}");
            config = {}
        }
        return config;
    }
}

export const write_config = async(config:JSON) => {
    const config_path = await path.join(await path.appDataDir(),"config.json")
    await writeTextFile(config_path, JSON.stringify(config, null, 2), {baseDir:BaseDirectory.AppData}).catch(e=>{console.error("[Error] Write config: ",e)});
}