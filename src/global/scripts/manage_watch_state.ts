import { writeTextFile, exists, mkdir, BaseDirectory, readTextFile } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";

export const update_watch_state = async (
    {source_id,preview_id,season_id="0",watch_id,state}
    :{source_id:string,preview_id:string,season_id?:string,watch_id:string,state:any}
) => {
    const watch_state_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id, season_id, "watch_state");
    if (!await exists(watch_state_dir)) await mkdir(watch_state_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});

    const watch_state_manifest = await path.join(watch_state_dir, `${watch_id}.json`);

    await writeTextFile(watch_state_manifest, JSON.stringify(state), {baseDir:BaseDirectory.AppData, create:true}).catch((e)=>{console.error(e)});
    
}

export const get_watch_state = async (
    {source_id,preview_id,season_id="0",watch_id}
    :{source_id:string,preview_id:string,season_id?:string,watch_id:string}
) => {
    try{
        const watch_state_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id, season_id, "watch_state");
        if (!await exists(watch_state_dir)) await mkdir(watch_state_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});

        const watch_state_manifest = await path.join(watch_state_dir, `${watch_id}.json`);
        if (!await exists(watch_state_manifest)) return {code:404, message:"Not exist"};
        const data = JSON.parse(await readTextFile(watch_state_manifest, {baseDir:BaseDirectory.AppData}));
        return {code:200, data};
    }catch(e){
        console.error(e);
        return {code:500,message:e}
    }
}
