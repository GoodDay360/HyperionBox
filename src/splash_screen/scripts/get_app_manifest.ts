import {  readTextFile } from '@tauri-apps/plugin-fs';

import write_crash_log from '../../global/scripts/write_crash_log';

const get_app_manifest = async ({setFeedback}:any)=>{

    if (import.meta.env.DEV && import.meta.env.VITE_DEV_USE_LOCAL_APP_MANIFEST === "1") {
        try{
            return {code:200, data:JSON.parse(await readTextFile(import.meta.env.VITE_DEV_LOCAL_APP_MANIFEST_PATH))};
        }catch(e){
            console.log("[MANIFEST] Error reading local manifest:",e);
            await write_crash_log(`[MANIFEST] Error reading local manifest:${JSON.stringify(e)}`);
            setFeedback({text:"Error reading local manifest.", color:"red",type:"error"});
            return {code:500, message:"Error reading local manifest."};
        }
        
    }else{
        const manifest_response:any = await new Promise((resolve,_) =>{
            fetch(
                "https://raw.githubusercontent.com/GoodDay360/HyperionBox/refs/heads/main/app.manifest.json",
                {method: "get"}
            )
            .then(async (response) => {
                const manifest = (await response.json());
                console.log("ONLINE", manifest)
                resolve({data:manifest, code:200})
            })
            .catch(error => {
                console.error('Error fetching the data:', error);

                resolve({message:error, code:500})
            });
        })
        
        
        if (manifest_response.code === 200) {
            return {code:200, data:manifest_response.data};
        }else{
            setFeedback({text:`Failed to check update manifest.`, color:"red",type:"error"})
            return {code:500, message:manifest_response?.message};
        }
    }
}

export default get_app_manifest;