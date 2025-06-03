import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, remove, mkdir, readFile, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';


const get_source = async () => {

    try{
        if (import.meta.env.DEV && import.meta.env.VITE_DEV_USE_LOCAL_SOURCE_MANIFEST === "1") {
        const source_manifest_path = import.meta.env.VITE_DEV_LOCAL_SOURCE_MANIFEST_PATH;
        const source_manifest = JSON.parse(await readTextFile(source_manifest_path));
        return {code:200, data:source_manifest};

        } else {
            return {code:404, message:"Not exist"};
        }
    }catch(e){
        console.error(e);
        return {code:500, message:"Internal Error"};
    }

}

export default get_source;