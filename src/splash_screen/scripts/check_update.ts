// Tauri Plugins
import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, mkdir, readFile} from '@tauri-apps/plugin-fs';
import { Window } from "@tauri-apps/api/window";
import { openPath } from '@tauri-apps/plugin-opener';
import { ask } from '@tauri-apps/plugin-dialog';
import { platform, arch } from '@tauri-apps/plugin-os';
import { getVersion } from '@tauri-apps/api/app';

// External Imports
import semver from 'semver';

// Custom Imports


import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import get_app_manifest from './get_app_manifest';

const chunkSize = 6 * 1024 * 1024; 

const check_update = async ({ setFeedback, setProgress}:any) => {
    try{

        const get_app_manifest_result = await get_app_manifest({setFeedback});
        let manifest:any = {}
        if (get_app_manifest_result.code === 200) {
            manifest = get_app_manifest_result.data;
        }else{
            setFeedback({text:"Error reading update manifest.", color:"red",type:"error"})
            return {code:500, message:"Error reading update manifest."};
        }

        const url = manifest?.[await platform()]?.[await arch()]?.url;
        const version = manifest?.[await platform()]?.[await arch()]?.version;
        if (!url) {
            setFeedback({text:"Your system doesn't support this app."})
            return {code:500, message:"System not support."};
        }

        if (!version) {
            setFeedback({text:"Your system doesn't support this app."})
            return {code:500, message:"System not support."};
        }else{
            const current_version = await getVersion();
            if (semver.eq(current_version, version)) {
                return {code:200, message:"No update available."};
            }else{
                const answer = await ask(`There is new version available. Update now?\n\nCurrent Version: ${current_version}\nAvailable Version: ${version}`, {
                    title: 'HyperionBox Updater',
                    kind: 'info',
                });
                if (!answer) {
                    return {code:200, message:"Skip update."};
                }
                
            }
        }
        
        const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app")
        await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})
        const output_file = await path.join(temp_dir, `hyperionbox_updater_${version}.msi`)

        let start_size = 0;
        if (await exists(output_file)) {
            const file = await readFile(output_file, {baseDir:BaseDirectory.Temp});
            start_size = file.byteLength;
        }

        setFeedback({text:"Downloading update..."})

        await download_file_in_chunks({
            url, 
            start_size,
            chunk_size:chunkSize, 
            output_file:output_file,
            callback: ({current_size,total_size}:any) => {
                setProgress({state:true,value:current_size*100/total_size})

            }
        });

        setProgress({state:false,value:0})

        setFeedback({text:"Starting update..."})
        try {
            await openPath(output_file);


            await Window.getCurrent().close();
            return {code:503, message:"Working on update."};
        } catch (error) {
            console.log("[Error] check_update: ", error);
            setFeedback({text:"Error starting update.", color:"red",type:"error"})
            return {code:500, message:error};
        }
    }catch(e:any){
        console.error("[Error] check_update: ", e);
        return {code:500, message:e};
    }
}

export default check_update;