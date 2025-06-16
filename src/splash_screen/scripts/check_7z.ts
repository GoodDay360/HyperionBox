import { platform, arch } from '@tauri-apps/plugin-os';

import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, remove, mkdir, open, writeFile, readFile} from '@tauri-apps/plugin-fs';

import JSZip from 'jszip';

import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import execute_command from '../../global/scripts/execute_command';
import get_7z_path from '../../global/scripts/get_7z_path';
const chunkSize = 6 * 1024 * 1024; 

const check_7z = async ({manifest, setFeedback, setProgress}:any) => {

    try{
        console.log("my os is", await platform(), await arch())
        const url = manifest?.["7z"]?.[await platform()]?.[await arch()]?.url;
        if (!url) {
            setFeedback("Your system doesn't support this app.")
            return {code:500, message:"System not support."};
        }
        
        const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app")
        await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})
        const output_file = await path.join(temp_dir, `7z.zip`)

        let start_size = 0;
        if (await exists(output_file)) {
            const file = await readFile(output_file, {baseDir:BaseDirectory.Temp});
            start_size = file.byteLength;
        }

        setFeedback({text:"Downloading 7z..."})

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

        setFeedback({text:"Extracting 7z..."})

        const buf = await new Promise<Uint8Array>(async (resolve,reject)=>{
            open(output_file, {
                read: true,
                baseDir: BaseDirectory.Temp,
            })
            .then(async (file)=>{
                const stat = await file.stat();
                const buf = new Uint8Array(stat.size);
                await file.read(buf);
                await file.close();
                resolve(buf)
            })
            .catch((e)=>{
                console.error(e);
                reject(e)
            });
        })
        
        
        await new Promise<any>(async (resolve,reject)=>{
            const zip = new JSZip();

            zip.loadAsync(buf)
            .then(async (zip) => {
                const bin_dir = await path.join(await path.appDataDir(),"bin")
                const extract_dir = await path.join(bin_dir,"7z")

                if (await exists(extract_dir)) {
                    await remove(extract_dir,{baseDir:BaseDirectory.AppData, recursive:true})
                };

                await mkdir(extract_dir, {baseDir: BaseDirectory.AppData, recursive:true});

                for (const relativePath in zip.files) {
                    const result = await new Promise<any>(async (resolve,reject)=>{
                        const file = zip.files[relativePath];
                    
                        if (!file.dir) {
                            file.async("uint8array")
                            .then((content) => {

                                resolve({type: "file", path:relativePath, data: new Uint8Array(content)})
                            })
                            .catch((error) => {
                                console.error("Error reading file:", error);
                                reject(error)
                            });
                        }else{
                            resolve({type: "dir", path:relativePath})
                        }
                    })
                    const extract_response = await new Promise<any>(async (resolve,reject)=>{
                        if (result.type === "dir"){
                            mkdir(await path.join(extract_dir,result.path), {baseDir: BaseDirectory.AppData})
                            .then(()=>resolve({code:200,message:"OK"}))
                            .catch((e)=>{reject({code:500,message:"[dir]"+e});return;})
                        }else if (result.type === "file"){
                            writeFile(await path.join(extract_dir,result.path), result.data, {baseDir: BaseDirectory.AppData, create:true})
                            .then(()=>resolve({code:200,message:"OK"}))
                            .catch((e)=>{reject({code:500,message:"[file]"+e});return;})
                        }
                    })
                    if (extract_response.code !== 200) {
                        reject(extract_response);
                        return
                    }
                };
                resolve({code:200,message:"OK"})
            })
            .catch(async (error) => {
                console.error("Error loading ZIP:", error);
                await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)});
                reject(error);
            });
        })

        if (!await exists(await get_7z_path)) return {code:500, message:"7z install failed."}

        await remove(output_file,{baseDir:BaseDirectory.Temp})

        if (await platform() !== "windows"){
            const execute_result = await execute_command({title:"7z_chmod",command:`chmod +x ${await get_7z_path}`, wait:true, spawn:false});
            if (execute_result.stderr) {
                return {code:500, message:execute_result.stderr};
            }
        }
        return {code:200, message:"OK"}
    }catch(e:any){
        console.error("[Error] check_7z: ", e);
        return {code:500, message:e};
    }
}

export default check_7z;