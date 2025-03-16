import { BaseDirectory } from '@tauri-apps/plugin-fs';
import Database from '@tauri-apps/plugin-sql';

const load_tags = async ({set_tag_data}:any)=> {
    return await new Promise <any>(async (resolve, reject)=>{
        const db = await Database.load('sqlite:watchlist.db');
        const result = await db.select("SELECT name FROM sqlite_master WHERE type='table'");
        set_tag_data(result);
        console.log(result);
    })
}

export default load_tags;