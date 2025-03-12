import { info, error } from '@tauri-apps/plugin-log';
import { platform, arch } from '@tauri-apps/plugin-os';
import axios from 'axios';
import { fetch } from '@tauri-apps/plugin-http';
import { path } from '@tauri-apps/api';
import { writeFile, BaseDirectory, exists, remove, mkdir} from '@tauri-apps/plugin-fs';

import download_file_in_chunks from '../../global/script/download_file_in_chunck';



const check_7z = async ({setFeedback}:any) => {
    info(await arch() + await platform())

    setFeedback("Downloading 7z...")

    const url:string = await new Promise((resolve,reject) =>{
        axios({
            url: "https://raw.githubusercontent.com/GoodDay360/HyperionBox/refs/heads/main/bin.manifest.json",
            method: "get"
        })
        .then(async (response) => {
            const node_manifest = response.data.files?.["7z"];

            const node_url = node_manifest?.[await platform()];
            if (!node_url) setFeedback("Your system doesn't support this app.")
            resolve(node_url)
        })
        .catch(error => {
            error('Error fetching the data:', error);
            reject(error)
        });
    })


    info(url)
    const chunkSize = (1024 * 1024)/2; // 1MB
    const bin_folder = await path.join(await path.appDataDir(),"bin")
    await mkdir(await path.join(await path.appDataDir(),"bin"), {recursive:true,baseDir:BaseDirectory.AppData})
    const output_file = await path.join(bin_folder, "7z.exe")
    console.log(output_file)
    exists(output_file).catch((e)=>console.log(e))
    if (await exists(output_file)) remove(output_file, {recursive:true})
    await download_file_in_chunks({
        url: url, chunkSize:chunkSize, output_file:output_file,
        callback: ({current_size,total_size}:any) => {
            console.log(current_size+"/"+total_size)
        }
    });


}

export default check_7z;