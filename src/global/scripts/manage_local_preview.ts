import { writeTextFile, readTextFile, exists, mkdir, BaseDirectory, remove } from "@tauri-apps/plugin-fs"
import { path } from "@tauri-apps/api"
import download_file_in_chunks from "./download_file_in_chunk"
import { convertFileSrc } from '@tauri-apps/api/core';
import { get_data_storage_dir } from "./manage_data_storage_dir";

export const get_local_preview = async ({source_id,preview_id}:{source_id:string,preview_id:string}) => {
    const DATA_DIR = await get_data_storage_dir();
    const preview_dir = await path.join(DATA_DIR, source_id, preview_id)
    if (!(await exists(preview_dir))) return {code:404,message:"Not exist"}
    const manifest_path = await path.join(preview_dir,"manifest.json")
    let manifest_data
    if (await exists(manifest_path)){
        try{
            manifest_data = JSON.parse(await readTextFile(manifest_path, {baseDir:BaseDirectory.AppData}))
            
            const cover_path = await path.join(preview_dir,"cover.jpg")
            if (await exists(cover_path)) manifest_data.info.local_cover = convertFileSrc(cover_path)
            return {code:200,result:manifest_data}
        }catch{
            console.error({code:404,message:"Eror parsing json. This treat as not exist."})
            return {code:404,message:"Eror parsing json. This treat as not exist."}
        }
    }else{
        return {code:404,message:"Not exist"}
    }
    
}


export const save_local_preview = async (
    {source_id,preview_id,data}:{source_id:string,preview_id:string,data:any}, 
    options?: { update_cover: "require" | "optional" | "ignore" }
) => {
    const { 
        
        update_cover = options?.update_cover||"require" 

    } = options || {};

    const DATA_DIR = await get_data_storage_dir();
    const preview_dir = await path.join(DATA_DIR, source_id, preview_id)
    if (!(await exists(preview_dir))) await mkdir(preview_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)})
    const manifest_path = await path.join(preview_dir,"manifest.json")
    const cover_path = await path.join(preview_dir,"cover.jpg")

    if (update_cover === "require"){
        await download_file_in_chunks({url:data.info.cover, output_file: cover_path})
    }else if (update_cover === "optional" && !await exists(cover_path)){
        await download_file_in_chunks({url:data.info.cover, output_file: cover_path})
    }

    await writeTextFile(manifest_path,JSON.stringify(data), {baseDir:BaseDirectory.AppData, create:true}).catch((e)=>{console.error(e)})
}

export const remove_local_preview = async ({source_id,preview_id}:{source_id:string,preview_id:string}) => {
    const DATA_DIR = await get_data_storage_dir();
    const preview_dir = await path.join(DATA_DIR, source_id, preview_id)
    if (await exists(preview_dir)) {
        await remove(preview_dir,{baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)})
    }
}
