import Database from '@tauri-apps/plugin-sql';
import { exists, BaseDirectory, remove } from "@tauri-apps/plugin-fs"
import { path } from "@tauri-apps/api"

const DATABASE_PATH:string = 'sqlite:download_task.db'

async function setup_table() {
    const db = await Database.load(DATABASE_PATH);
    const checkQuery = `
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' AND name='download_task'
    `;
    const checkResult:any = await db.select(checkQuery);
    if (checkResult.length === 0) {
        const createQuery = `
        CREATE TABLE download_task ( 
            source_id TEXT NOT NULL,
            preview_id TEXT NOT NULL, 
            season_id TEXT DEFAULT "0",
            title TEXT NOT NULL,
            watch_index INT NOT NULL,
            watch_id TEXT NOT NULL,
            quality INT NOT NULL,
            server_id TEXT DEFAULT "",
            server_type TEXT DEFAULT "",
            type_schema INT NOT NULL,
            datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
            error INTEGER DEFAULT 0
        )
        `;
        await db.execute(createQuery);
        console.log(`Table "download_task" created successfully.`);
    }
}

export async function request_download_task(): Promise<{ code: number, data: any }> {
    await setup_table();
    const db = await Database.load(DATABASE_PATH);
    const query = `
        SELECT *
        FROM download_task
        ORDER BY source_id, preview_id, season_id, watch_index, datetime DESC
    `;
    const results: any[] = await db.select(query);

    const request_result: { source_id: string, preview_id: string, season_id: string, quality: number, server_type:string, type_schema: string, data: { watch_index: number, watch_id: string, title: string, error: boolean }[] }[] = [];

    results.forEach((result) => {
        const existingItemIndex = request_result.findIndex((item) => item.source_id === result.source_id && item.preview_id === result.preview_id && item.season_id === result.season_id && item.type_schema === result.type_schema);
        if (existingItemIndex !== -1) {
            request_result[existingItemIndex].data.push({
                watch_index: result.watch_index,
                watch_id: result.watch_id,
                title: result.title,
                error: result.error ? true : false,
            });
        } else {
            request_result.push({
                source_id: result.source_id,
                preview_id: result.preview_id,
                season_id: result.season_id,
                quality: result.quality,
                server_type: result.server_type,
                type_schema: result.type_schema,
                data: [
                    {
                        watch_index: result.watch_index,
                        watch_id: result.watch_id,
                        title: result.title,
                        error: result.error ? true : false,
                    },
                ],
            });
        }
    });
    
    request_result.forEach((item) => {
        item.data.sort((a, b) => (a.watch_index as number) - (b.watch_index as number));
    });

    return { code: 200, data: request_result };
}

export async function request_add_download_task({
    source_id,
    preview_id,
    season_id="0",
    title,
    watch_index,
    watch_id,
    quality,
    server_type,
    type_schema
}: {
    source_id: string,
    preview_id: string,
    season_id?: string,
    title:string,
    watch_index:number,
    watch_id: string,
    quality: number,
    server_type: string,
    type_schema: number
}) {
    if (type_schema === 2 && season_id!=="0"){
        return { code: 422, message: "type_schema:2 require season_id!"};
    }
    await setup_table();
    const db = await Database.load(DATABASE_PATH);
    const existsQuery = `
        SELECT 1
        FROM download_task
        WHERE source_id = $1 AND preview_id = $2 AND watch_id = $3
    `;
    const existsResult:any = await db.select(existsQuery, [source_id, preview_id, watch_id]);
    if (existsResult.length > 0) {
        return { code: 403, message: "Already Exist" };
    }
    const insertQuery = `
        INSERT INTO download_task (source_id, preview_id, season_id, title, watch_index, watch_id, quality, server_type, type_schema)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    await db.execute(insertQuery, [source_id, preview_id, season_id, title, watch_index, watch_id, quality, server_type, type_schema]);
    return { code: 200, message: "Added successfully" };
}

export async function request_current_task(): Promise<any> {
    await setup_table();
    const db = await Database.load(DATABASE_PATH);
    const query = `
        SELECT *
        FROM download_task
        WHERE error = 0
        ORDER BY datetime ASC
        LIMIT 1
    `;
    const result:any = await db.select(query);
    if (result.length === 0) return { code: 204, message: "Empty Task" };
    else return { code: 200, data: result[0] };
    
}

export async function request_remove_download_task({
    source_id,
    preview_id,
    season_id="0",
    watch_id,
    clean=false,
}: {
    source_id: string,
    preview_id: string,
    season_id?: string,
    watch_id: string,
    clean?: boolean,
}) {
    await setup_table();
    const db = await Database.load(DATABASE_PATH);
    const deleteQuery = `
        DELETE FROM download_task
        WHERE source_id = $1 AND preview_id = $2 AND season_id = $3 AND watch_id = $4
    `;
    await db.execute(deleteQuery, [source_id, preview_id, season_id, watch_id]);

    if (clean){
        const main_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id, season_id, "download", watch_id);
        if (await exists(main_dir)) await remove(main_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
    }
    
    return { code: 200, message: "Removed successfully" };
}



export async function request_set_error_task({
    source_id,
    preview_id,
    season_id="0",
    watch_id,
    error=true
}: {
    source_id: string,
    preview_id: string,
    season_id?: string,
    watch_id: string,
    error?: boolean
}) {
    await setup_table();
    const db = await Database.load(DATABASE_PATH);
    const updateQuery = `
        UPDATE download_task
        SET error = $5
        WHERE source_id = $1 AND preview_id = $2 AND season_id = $3 AND watch_id = $4
    `;
    await db.execute(updateQuery, [source_id, preview_id, season_id, watch_id, error ? 1 : 0]);
    return { code: 200, message: "Error set successfully" };
}