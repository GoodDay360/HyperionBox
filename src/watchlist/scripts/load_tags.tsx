import { BaseDirectory } from '@tauri-apps/plugin-fs';
import Database from '@tauri-apps/plugin-sql';

const load_tags = async ({set_tag_data, set_selected_tag}:any)=> {
    return await new Promise <any>(async (resolve, reject)=>{
        const db = await Database.load('sqlite:watchlist.db');
        const result:any = (await db.select("SELECT name FROM sqlite_master WHERE type='table'") as any).map((item:any) => item.name);
        set_tag_data(result);
        if (result.length > 0) set_selected_tag(result[0]);
        console.log(result);
    })
}

export default load_tags;