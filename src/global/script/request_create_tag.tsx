
import Database from '@tauri-apps/plugin-sql';
import { m } from 'framer-motion';

const request_create_tag = async ({tag_name,callback=()=>{}}:any)=> {
    console.log(tag_name)
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
        return {code:500, message:`Table "${tableName}" already exists.`};;
    }
}

export default request_create_tag;