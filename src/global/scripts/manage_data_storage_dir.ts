
import { path } from '@tauri-apps/api';
import { read_config, write_config } from './manage_config';
import { BaseDirectory, exists, mkdir} from '@tauri-apps/plugin-fs';

export const get_data_storage_dir = async () => {
    
    const config_manifest = await read_config();
    let data_storage_dir:string = "";
    if (config_manifest.data_storage_dir){
        data_storage_dir = config_manifest.data_storage_dir;
    }else{
        data_storage_dir = await path.join(await path.appDataDir(), "data");
        write_config({...config_manifest, data_storage_dir});
    }   
    if (!await exists(data_storage_dir)){
        await mkdir(data_storage_dir, {baseDir:BaseDirectory.AppData, recursive:true});
    }
    return data_storage_dir;
    

}

export const update_data_storage_dir = async (data_storage_dir:string) => {
    const config_manifest = await read_config();
    write_config({...config_manifest, data_storage_dir});
}