import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, remove, mkdir, readFile, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';
import { fetch } from "@tauri-apps/plugin-http";

const get_source = async () => {

    try{
        if (import.meta.env.DEV && import.meta.env.VITE_DEV_USE_LOCAL_SOURCE_MANIFEST === "1") {
        const source_manifest_path = import.meta.env.VITE_DEV_LOCAL_SOURCE_MANIFEST_PATH;
        const source_manifest = JSON.parse(await readTextFile(source_manifest_path));
        return {code:200, data:source_manifest};

        } else {
            try {
                const response = await fetch('https://raw.githubusercontent.com/GoodDay360/HyperionBox-Extensions/refs/heads/main/sources.manifest.json', {
                    method: 'GET',
                });

                if (!response.ok) {
                    return {code:500, message:`HTTP error! Status: ${response.status}`};
                }

                const data = await response.json();
                console.log(data)
                return {code:200,data};
            } catch (error) {
                console.error('Fetch error:', error);
                return {code:500, message:error};
            }
        }
    }catch(e){
        console.error(e);
        return {code:500, message:"Internal Error"};
    }

}

export default get_source;