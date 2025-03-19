
import Database from '@tauri-apps/plugin-sql';


export const request_tag_data = async ()=> {
    return await new Promise <any>(async (resolve,reject)=>{
        try{
            const db = await Database.load('sqlite:watchlist.db');
            const result:any = (await db.select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name") as any).map((item:any) => item.name);
            resolve({code:200,message:"OK", data:result});
        }catch(e:any){reject({code:500,message:e.message})}
    })
}

export const request_create_tag = async ({tag_name,callback=()=>{}}:any)=> {
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
            id INTEGER PRIMARY KEY, 
            name TEXT, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP 
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
    const db = await Database.load('sqlite:watchlist.db');

    // Execute the SQL query to drop the table
    await db.execute(`DROP TABLE IF EXISTS "${tag_name}";`);


    return {code:200, message:`Table "${tag_name}" has been successfully deleted.`};
    } catch (error) {
        console.error('Error deleting the table:', error);
        return {code:500, message:error};
    }
};