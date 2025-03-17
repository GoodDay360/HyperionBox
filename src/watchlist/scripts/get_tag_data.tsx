import Database from '@tauri-apps/plugin-sql';

const get_tag_data = async ()=> {
    return await new Promise <any>(async (resolve,reject)=>{
        try{
            const db = await Database.load('sqlite:watchlist.db');
            const result:any = (await db.select("SELECT name FROM sqlite_master WHERE type='table'") as any).map((item:any) => item.name);
            resolve({code:200,message:"OK", data:result});
        }catch(e:any){reject({code:500,message:e.message})}
    })
}

export default get_tag_data;