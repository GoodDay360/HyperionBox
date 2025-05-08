import Database from '@tauri-apps/plugin-sql';

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
            season_id INT DEFAULT 0,
            preview_id TEXT NOT NULL, 
            watch_id TEXT NOT NULL,
            quality INT NOT NULL,
            type_schema INT NOT NULL,
            datetime DATETIME DEFAULT CURRENT_TIMESTAMP 
        )
        `;
        await db.execute(createQuery);
        console.log(`Table "download_task" created successfully.`);
    }
}

export async function request_add_download_task({
    source_id,
    season_id=0,
    preview_id,
    watch_id,
    quality,
    type_schema
}: {
    source_id: string,
    season_id?: number,
    preview_id: string,
    watch_id: string,
    quality: number,
    type_schema: number
}) {
    if (type_schema === 2 && !season_id){
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
        INSERT INTO download_task (source_id, season_id, preview_id, watch_id, quality, type_schema)
        VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await db.execute(insertQuery, [source_id, season_id, preview_id, watch_id, quality, type_schema]);
    return { code: 200, message: "Added successfully" };
}

export async function request_remove_download_task({
    source_id,
    season_id=0,
    preview_id,
    watch_id
}: {
    source_id: string,
    season_id?: number,
    preview_id: string,
    watch_id: string
}) {
    await setup_table();
    const db = await Database.load(DATABASE_PATH);
    const deleteQuery = `
        DELETE FROM download_task
        WHERE source_id = $1 AND season_id = $2 AND preview_id = $3 AND watch_id = $4
    `;
    await db.execute(deleteQuery, [source_id, season_id, preview_id, watch_id]);
    return { code: 200, message: "Removed successfully" };
}

export async function request_current_task(): Promise<{ code: number, data: any }> {
    await setup_table();
    const db = await Database.load(DATABASE_PATH);
    const query = `
        SELECT *
        FROM download_task
        ORDER BY datetime ASC
        LIMIT 1
    `;
    const result:any = await db.select(query);
    return { code: 200, data: result[0] };
}