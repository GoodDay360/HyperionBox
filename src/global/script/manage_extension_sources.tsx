import Database from '@tauri-apps/plugin-sql';

async function setupDatabase(): Promise<void> {
    try {
        // Load the SQLite database
        const db = await Database.load('sqlite:extension.db');

        // Create the 'source' table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS source (
                id TEXT NOT NULL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                version TEXT,
                install_date TEXT DEFAULT (DATETIME('now'))
            )
        `);
        console.log('Database and table setup complete!');
    } catch (error) {
        console.error('Error setting up database:', error);
        throw('Error setting up database.');
    }
}

export const get_installed_sources = async (offset?: number, limit?: number): Promise<any> => {
    try {
        // Check if only one of limit or offset is provided
        if ((limit !== undefined && offset === undefined) || (limit === undefined && offset !== undefined)) {
            return { code: 500, message: "Both 'offset' and 'limit' must be provided together." };
        }
    
        
        await setupDatabase();
        const db = await Database.load('sqlite:extension.db');
    
        let query: string;
        let params: any[] = [];
    
        if (limit === undefined && offset === undefined) {
            // If neither limit nor offset is provided, fetch all rows
            query = `
            SELECT *
            FROM source
            `;
        } else {
            // Both limit and offset are provided
            query = `
            SELECT *
            FROM source
            LIMIT $1
            OFFSET $2
            `;
            params = [limit, offset];
        }
    
        const results: any = await db.select(query, params);
        return { code: 200, message: "OK", data: results };
    } catch (error) {
        console.error('Error fetching extension sources:', error);
        return { code: 500, message: error };
    }
};
    