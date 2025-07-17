
import Database from '@tauri-apps/plugin-sql';
import { path } from '@tauri-apps/api';
import { exists, remove, BaseDirectory, readTextFile, } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { get_watch_state } from './manage_watch_state';
import { get_data_storage_dir } from './manage_data_storage_dir';

const DATABASE_PATH:string = 'sqlite:watchlist.db'
const REQUEST_LIMIT = 15;

export const request_tag_data = async ()=> {
    return await new Promise <any>(async (resolve,reject)=>{
        try{
            const db = await Database.load(DATABASE_PATH);
            const result:any = (await db.select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name") as any).map((item:any) => item.name);
            resolve({code:200,message:"OK", data:result});
        }catch(e:any){reject({code:500,message:e.message})}
    })
}

export const request_create_tag = async ({tag_name}:any)=> {
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) return {code:500, message:`Invalid tag name format.`};
    // Load the database
    const db = await Database.load(DATABASE_PATH);

    // Check if the table exists
    const tableName = tag_name; 
    const checkQuery = `
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' AND name=$1
    `;

    const checkResult:any = await db.select(checkQuery, [tableName]);

    if (checkResult.length === 0) {
        const createQuery = `
            CREATE TABLE "${tableName}" ( 
                source_id TEXT NOT NULL,
                preview_id TEXT NOT NULL, 
                title TEXT NOT NULL,
                datetime DATETIME DEFAULT CURRENT_TIMESTAMP 
            )
        `;
        await db.execute(createQuery);
        console.log(`Table "${tableName}" created successfully.`);
        return {code:200, message:`Table "${tableName}" created successfully.`};
    } else {
        console.error(`Table "${tableName}" already exists.`);
        return {code:500, message:`Tag "${tableName}" already exists.`};
    }
}


export const request_rename_tag = async ({
        current_tag_name,
        new_tag_name,
    }: {
        current_tag_name: string;
        new_tag_name: string;
}) => {
        try {
        // Validate table names to avoid SQL injection
        if (!new_tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
            console.error('Invalid table name format.');
            return {code:500, message:'Invalid tag name format.'};
        }
    
        // Load the database connection
        const db = await Database.load(DATABASE_PATH);
    
        // Execute the SQL query to rename the table
        await db.execute(`ALTER TABLE "${current_tag_name}" RENAME TO "${new_tag_name}";`);
    
        // Call the callback function on success
        return {code:200, message:`Table renamed from "${current_tag_name}" to "${new_tag_name}".`};
        } catch (error) {
            console.error('Error renaming the table:', error);
            return {code:500, message:error};
        }
};

export const request_delete_tag = async ({
        tag_name,
    }: {
        tag_name: string;
}) => {
    try {
    // Validate table name to ensure it follows proper conventions
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        console.error('Invalid table name format.');
        return {code:500, message:'Invalid table name format.'};
    }

    // Load the database connection
    
    
    let max_page:number;
    let current_page:number = 1;
    while(true){
        const request_content_from_tag_result:any = await request_content_from_tag({tag_name, page:current_page});
        if (request_content_from_tag_result.code === 200) {
            max_page = request_content_from_tag_result.max_page;
            const data = request_content_from_tag_result.data;
            for (const item of data) {
                const source_id = item.source_id;
                const preview_id = item.preview_id;
                const request_item_tags_result:any = await request_item_tags({source_id,preview_id});
                if (request_item_tags_result.code === 200) {
                    const remain_tags = request_item_tags_result.data.filter((item:string) => item !== tag_name);
                    if (!remain_tags.length) {
                        const preview_dir = await path.join(await get_data_storage_dir(), source_id, preview_id)
                        if (await exists(preview_dir)) {
                            await remove(preview_dir,{baseDir:BaseDirectory.AppData, recursive:true}).catch((e)=>{console.error(e)});
                            console.log("Local save removed: ",preview_dir)
                        }
                    }
                }
            }
            
        }else break
        if (current_page >= max_page) break;
        else current_page++;
    }
    
    const db = await Database.load(DATABASE_PATH);
    // Execute the SQL query to drop the table
    await db.execute(`DROP TABLE IF EXISTS "${tag_name}";`);


    return {code:200, message:`Table "${tag_name}" has been successfully deleted.`};
    } catch (error) {
        console.error('Error deleting the table:', error);
        return {code:500, message:error};
    }
};

export const request_add_to_tag = async ({ tag_name, source_id, preview_id, title }
    :{
        tag_name: string,
        source_id: string,
        preview_id: string,
        title: string,
}) => {
    // Validate the input
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        return { code: 500, message: `Invalid tag name format.` };
    }

    // Load the database
    const db = await Database.load(DATABASE_PATH);

    // Check if the table exists
    const checkQuery = `
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name=$1
    `;

    const checkResult: any = await db.select(checkQuery, [tag_name]);

    if (checkResult.length === 0) {
        console.error(`Table "${tag_name}" does not exist.`);
        return { code: 500, message: `Tag "${tag_name}" does not exist.` };
    }

    // Check if the item already exists
    const existsQuery = `
        SELECT 1
        FROM "${tag_name}"
        WHERE source_id = $1 AND preview_id = $2
    `;

    const existsResult: any = await db.select(existsQuery, [source_id, preview_id]);

    if (existsResult.length > 0) {
        console.error(`Item already exists in tag "${tag_name}". Skipping insertion.`);
        return { code: 200, message: `Item already exists in tag "${tag_name}".` };
    }

    // Add the item to the tag (table)
    const insertQuery = `
        INSERT INTO "${tag_name}" (source_id, preview_id, title, datetime)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `;

    try {
        await db.execute(insertQuery, [source_id, preview_id, title]);
        console.error(`Item added to tag "${tag_name}" successfully.`);
        return { code: 200, message: `Item added to tag "${tag_name}" successfully.` };
    } catch (error) {
        console.error(`Error adding item to tag "${tag_name}":`, error);
        return { code: 500, message: `Failed to add item to tag "${tag_name}".` };
    }
};

export const request_update_tag = async ({
    source_id,
    preview_id,
    title,
}: {
    source_id: string;
    preview_id: string;
    title: string;
}) => {
    // Get the list of all tag data
    const tagData = await request_tag_data();
        if (tagData.code !== 200) {
        console.error(tagData.message);
        return { code: 500, message: `Failed to get tag data` };
    }

    const tagList = tagData.data;

    // Iterate over the tags and update the title of all rows
    for (const tagName of tagList) {
        // Load the database
        const db = await Database.load(DATABASE_PATH);

        // Check if the table exists
        const checkQuery = `
            SELECT name
            FROM sqlite_master
            WHERE type='table' AND name=$1
        `;

        const checkResult: any = await db.select(checkQuery, [tagName]);

        if (checkResult.length === 0) {
            console.error(`Table "${tagName}" does not exist.`);
            continue;
        }

        // Update the title of all rows with the specified source_id and preview_id
        const updateQuery = `
            UPDATE "${tagName}"
            SET title = $1
            WHERE source_id = $2 AND preview_id = $3
        `;

        try {
            await db.execute(updateQuery, [title, source_id, preview_id]);
            console.log(`Title updated successfully in tag "${tagName}"`);
        } catch (error) {
            console.error(`Error updating title in tag "${tagName}":`, error);
        }
    }

    return { code: 200, message: `Title updated successfully in all tags` };
};


export const request_content_from_tag = async ({ tag_name, page, search }: { tag_name: string, page: number, search?:string }) => {
    // Validate the tag name
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        return { code: 500, message: `Invalid tag name format.` };
    }

    // Load the database
    const db = await Database.load(DATABASE_PATH);

    // Check if the table exists
    const tableName = tag_name;
    const checkQuery = `
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name=$1
    `;
    const checkResult: any = await db.select(checkQuery, [tableName]);
    if (checkResult.length === 0) {
        return { code: 500, message: `Table "${tableName}" does not exist.` };
    }

    // Get total number of rows in the table
    let countQuery = `
        SELECT COUNT(*) as total
        FROM "${tableName}"
    `;
    let countQueryParams: any[] = [];

    if (search) {
        countQuery = `
        SELECT COUNT(*) as total
        FROM "${tableName}"
        WHERE source_id LIKE $1 OR preview_id LIKE $1 OR title LIKE $1
        `;
        countQueryParams = [`%${search}%`];
    }

    const countResult: any = await db.select(countQuery, countQueryParams);
    const totalRows = countResult[0]?.total || 0;

    // If the table is empty, return an empty dataset with max_page 0
    if (totalRows === 0) {
        return {
            code: 200,
            message: `Data retrieved successfully.`,
            data: [],
            max_page: 0
        };
    }

    // Calculate the maximum number of pages
    const maxPage = Math.ceil(totalRows / REQUEST_LIMIT);

    // Ensure the page number is valid
    if (page < 1 || page > maxPage) {
        return { code: 400, message: `Invalid page number. It should be between 1 and ${maxPage}.` };
    }

    // Calculate the offset based on the page number
    const offset = (page - 1) * REQUEST_LIMIT;

    // Retrieve paginated data
    let dataQuery = `
        SELECT *
        FROM "${tableName}"
        ORDER BY datetime DESC
        LIMIT $1 OFFSET $2
    `;
    let dataQueryParams: any[] = [REQUEST_LIMIT, offset];

    if (search) {
        dataQuery = `
            SELECT *
            FROM "${tableName}"
            WHERE source_id LIKE $1 OR preview_id LIKE $1 OR title LIKE $1
            ORDER BY datetime DESC
            LIMIT $2 OFFSET $3
        `;
        dataQueryParams = [`%${search}%`, REQUEST_LIMIT, offset];
    }

    const queryResult: any = await db.select(dataQuery, dataQueryParams);

    const dataResult:any = [];
    console.log(queryResult)
    for (const item of queryResult) {
        const preview_dir = await path.join(await get_data_storage_dir(), item.source_id, item.preview_id);
        const manifest_path = await path.join(preview_dir, "manifest.json");
        if (await exists(manifest_path)) {
            try{
                const manifest = JSON.parse(await readTextFile(manifest_path, { baseDir: BaseDirectory.AppData }));
                const watch_state_result = await get_watch_state({source_id:item.source_id,preview_id:item.preview_id,season_id:manifest.season_id??"0",watch_id:manifest.watch_id})
                if (watch_state_result.code === 200) item.current_time = watch_state_result.data.current_time;
                
                const cover_path = await path.join(preview_dir, "cover.jpg");
                if (await exists(cover_path)) item.cover = convertFileSrc(cover_path);
                else item.cover = manifest.info.cover;
                dataResult.push(item);
            }catch(e:any){
                console.error(e)
                item.title = "?";

                dataResult.push(item);
            }
        }else{
            item.title = "?";
            dataResult.push(item);
        }
    }
    console.log("result", dataResult)
    return {
        code: 200,
        message: `Data retrieved successfully.`,
        data: dataResult,
        max_page: maxPage,
    };
};


export const request_remove_from_tag = async ({ tag_name, source_id, preview_id }: any) => {
    // Validate the input
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        return { code: 500, message: `Invalid tag name format.` };
    }

    // Load the database
    const db = await Database.load(DATABASE_PATH);

    // Check if the table exists
    const checkQuery = `
        SELECT name
        FROM sqlite_master
        WHERE type='table' AND name=$1
    `;

    const checkResult: any = await db.select(checkQuery, [tag_name]);

    if (checkResult.length === 0) {
        console.error(`Table "${tag_name}" does not exist.`);
        return { code: 500, message: `Tag "${tag_name}" does not exist.` };
    }

    

    // Remove the item from the tag (table)
    const deleteQuery = `
        DELETE FROM "${tag_name}"
        WHERE source_id = $1 AND preview_id = $2
    `;

    try {
        await db.execute(deleteQuery, [source_id, preview_id]);
        console.log(`Item removed from tag "${tag_name}" successfully.`);
        return { code: 200, message: `Item removed from tag "${tag_name}" successfully.` };
    } catch (error) {
        console.error(`Error removing item from tag "${tag_name}":`, error);
        return { code: 500, message: `Failed to remove item from tag "${tag_name}".` };
    }
};

export const request_item_tags = async ({ source_id, preview_id }: any) => {
    // Load the database
    const db = await Database.load(DATABASE_PATH);

    // Get all tables from the database
    const tablesQuery = `
        SELECT name
        FROM sqlite_master
        WHERE type='table'
    `;

    try {
        const tables: any = await db.select(tablesQuery);
        const matchingTags: string[] = [];

        for (const table of tables) {
            const tableName = table.name;

            // Skip system tables (if any)
            if (tableName === 'sqlite_sequence') {
                continue;
            }

            // Search for the item in the current table
            const searchQuery = `
                SELECT 1
                FROM "${tableName}"
                WHERE source_id = $1 AND preview_id = $2
            `;

            const searchResult: any = await db.select(searchQuery, [source_id, preview_id]);

            if (searchResult.length > 0) {
                matchingTags.push(tableName); // Add table (tag) name to the result if item is found
            }
        }

        console.log(`Item found in the following tags: ${matchingTags.join(', ')}`);
        return { code: 200, data: matchingTags };
    } catch (error) {
        console.error('Error searching for item tags:', error);
        return { code: 500, message: `Failed to search for item tags.` };
    }
};
