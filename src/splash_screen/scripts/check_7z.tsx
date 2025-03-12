import { info } from '@tauri-apps/plugin-log';
import { platform, arch } from '@tauri-apps/plugin-os';
import { fetch } from '@tauri-apps/plugin-http';
import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, remove, mkdir} from '@tauri-apps/plugin-fs';

import download_file_in_chunks from '../../global/script/download_file_in_chunck';
import get_platform_file_extensions from '../../global/script/get_platform_file_extensions';



const check_7z = async ({setFeedback}:any) => {
    info(await arch() + await platform())

    setFeedback({text:"Downloading 7z..."})


    try{
        const node_response:any = await new Promise((resolve,reject) =>{
            fetch(
                "https://raw.githubusercontent.com/GoodDay360/HyperionBox/refs/heads/main/bin.manifest.json",
                {method: "get"}
            )
            .then(async (response) => {
                const node_manifest = (await response.json()).files?.["7z"];
                resolve({data:node_manifest, code:200})
            })
            .catch(error => {
                console.error('Error fetching the data:', error);

                reject({message:error, code:500})
            });
        })
        if (node_response.code === 500) {
            return {code:500, message:"Fail to request node manifest."}
        }else{
            const node_url = node_response?.data?.[await platform()];
            if (!node_url) {
                setFeedback("Your system doesn't support this app.")
                return {code:500, message:"System not support."};
            }
            const chunkSize = 1024 * 1024; // 1MB
            const bin_folder = await path.join(await path.appDataDir(),"bin")
            await mkdir(await path.join(await path.appDataDir(),"bin"), {recursive:true,baseDir:BaseDirectory.AppData})
            const output_file = await path.join(bin_folder, `7z${await get_platform_file_extensions()}`)
            console.log(output_file)
            exists(output_file).catch((e)=>console.log(e))
            if (await exists(output_file)) remove(output_file, {recursive:true})
            
            return await download_file_in_chunks({
                url: node_url, chunkSize:chunkSize, output_file:output_file,
                callback: ({current_size,total_size}:any) => {
                    console.log(current_size+"/"+total_size)

                }
            });
            return {code: 200, message: 'OK'}
        }
    }catch{(e:unknown)=>{
        console.error("[Error] check_7z: ", e);
        return {code:500, message:e};
    }}
}

export default check_7z;