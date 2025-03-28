
import Database from '@tauri-apps/plugin-sql';
import request_content_from_tag from './request_content_from_tag';
import { path } from '@tauri-apps/api';
import { exists, remove, BaseDirectory } from '@tauri-apps/plugin-fs';

export const request_tag_data = async ()=> {
    return await new Promise <any>(async (resolve,reject)=>{
        try{
            const db = await Database.load('sqlite:watchlist.db');
            const result:any = (await db.select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name") as any).map((item:any) => item.name);
            resolve({code:200,message:"OK", data:result});
        }catch(e:any){reject({code:500,message:e.message})}
    })
}

export const request_create_tag = async ({tag_name}:any)=> {
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) return {code:500, message:`Invalid tag name format.`};
    // Load the database
    const db = await Database.load('sqlite:watchlist.db');

    // Check if the table exists
    const tableName = tag_name; // Replace with your table's name
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
                cover TEXT NOT NULL,
                watch_timeline INT DEFAULT 0,
                current_watch_index INT DEFAULT 0,
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
        const db = await Database.load('sqlite:watchlist.db');
    
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
                        const preview_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id)
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
    
    const db = await Database.load('sqlite:watchlist.db');
    // Execute the SQL query to drop the table
    await db.execute(`DROP TABLE IF EXISTS "${tag_name}";`);


    return {code:200, message:`Table "${tag_name}" has been successfully deleted.`};
    } catch (error) {
        console.error('Error deleting the table:', error);
        return {code:500, message:error};
    }
};

export const request_add_to_tag = async ({ tag_name, source_id, preview_id, title, cover }
    :{
        tag_name: string,
        title: string,
        cover: string,
        source_id: string,
        preview_id: string
    }) => {
    // Validate the input
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        return { code: 500, message: `Invalid tag name format.` };
    }

    // Load the database
    const db = await Database.load('sqlite:watchlist.db');

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
        INSERT INTO "${tag_name}" (source_id, preview_id, title, cover, datetime)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `;

    try {
        await db.execute(insertQuery, [source_id, preview_id, title, cover]);
        console.error(`Item added to tag "${tag_name}" successfully.`);
        return { code: 200, message: `Item added to tag "${tag_name}" successfully.` };
    } catch (error) {
        console.error(`Error adding item to tag "${tag_name}":`, error);
        return { code: 500, message: `Failed to add item to tag "${tag_name}".` };
    }
};

export const request_update_tag = async ({
    tag_name,
    source_id,
    preview_id,
    title,
    cover,
    watch_timeline,
    current_watch_index,
}: {
    tag_name: string;
    source_id: string;
    preview_id: string;
    title?: string;
    cover?: string; 
    watch_timeline?: number;
    current_watch_index?: number;
}) => {
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        return { code: 500, message: `Invalid tag name format.` };
    }

    // Load the database
    const db = await Database.load('sqlite:watchlist.db');

    // Prepare the UPDATE query
    let updateFields: string[] = [];
    let values: any[] = [];

    // Include fields only if they are provided
    if (title !== undefined) {
        updateFields.push(`title = ?`);
        values.push(title);
    }
    if (cover !== undefined) {
        updateFields.push(`cover = ?`);
        values.push(cover);
    }
    if (watch_timeline !== undefined) {
        updateFields.push(`watch_timeline = ?`);
        values.push(watch_timeline);
    }
    if (current_watch_index !== undefined) {
        updateFields.push(`current_watch_index = ?`);
        values.push(current_watch_index);
    }

    // Add datetime field update
    updateFields.push(`datetime = CURRENT_TIMESTAMP`);

    if (updateFields.length === 0) {
        return { code: 500, message: `No fields provided to update.` };
    }

    // Construct the query
    const updateQuery = `
    UPDATE "${tag_name}"
    SET ${updateFields.join(', ')}
    WHERE source_id = ? AND preview_id = ?
    `;

    // Add source_id and preview_id to the values
    values.push(source_id, preview_id);

    try {
        // Execute the update query
        const result = await db.execute(updateQuery, values);
        console.log(`Table "${tag_name}" updated successfully.`);
        return { code: 200, message: `Tag "${tag_name}" updated successfully.`, result };
    } catch (error) {
        console.error(`Failed to update tag "${tag_name}":`, error);
        return { code: 500, message: `Error updating tag "${tag_name}".`, error };
    }
};


export const request_remove_from_tag = async ({ tag_name, source_id, preview_id }: any) => {
    // Validate the input
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        return { code: 500, message: `Invalid tag name format.` };
    }

    // Load the database
    const db = await Database.load('sqlite:watchlist.db');

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
    const db = await Database.load('sqlite:watchlist.db');

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
