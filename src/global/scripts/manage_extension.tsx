import Database from '@tauri-apps/plugin-sql';

const REQUEST_LIMIT = 10;

async function setupDatabase(): Promise<void> {
    try {
        // Load the SQLite database
        const db = await Database.load('sqlite:extension.db');

        // Create the 'source' table if it doesn't exist
        await db.execute(`
            CREATE TABLE IF NOT EXISTS source (
                id TEXT NOT NULL PRIMARY KEY,
                domain TEXT NOT NULL,
                icon TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                version TEXT,
                datetime DATETIME DEFAULT CURRENT_TIMESTAMP 
            )
        `);
        console.log('Database and table setup complete!');
    } catch (error) {
        console.error('Error setting up database:', error);
        throw('Error setting up database.');
    }
}

export const get_all_installed_sources = async (): Promise<any> => {
    try {
        await setupDatabase();
        const db = await Database.load('sqlite:extension.db');

        const query = `
        SELECT *
        FROM source
        `;

        const results: any = await db.select(query);
        return { code: 200, message: "OK", data: results };
    } catch (error) {
        console.error('Error fetching all extension sources:', error);
        return { code: 500, message: error };
    }
};

export const get_installed_sources = async ({ page = 1 }: { page?: number }): Promise<any> => {
    try {
        const offset = (page - 1) * REQUEST_LIMIT;

        await setupDatabase();
        const db = await Database.load('sqlite:extension.db');

        let query: string;
        let params: any[] = [];

        query = `
        SELECT *
        FROM source
        LIMIT $1
        OFFSET $2
        `;
        params = [REQUEST_LIMIT, offset];

        const results: any = await db.select(query, params);

        // Get the total count of rows
        const totalCountQuery = `
        SELECT COUNT(*) as count
        FROM source
        `;
        const totalCountResult: any = await db.select(totalCountQuery);
        const totalCount = totalCountResult[0].count;

        // Calculate the max page
        const max_page = Math.ceil(totalCount / REQUEST_LIMIT);

        return { code: 200, message: "OK", data: results, max_page };
    } catch (error) {
        console.error('Error fetching extension sources:', error);
        return { code: 500, message: error };
    }
};

export async function add_source({id, domain, icon, title, description, version}:{
    id: string,
    domain: string,
    icon: string,
    title: string,
    description: string,
    version: string
}): Promise<{ code: number; message: string }> {
    try {
        await setupDatabase();
        
        // Load the SQLite database
        const db = await Database.load('sqlite:extension.db');

        // Check if the source already exists
        const existsQuery = `
            SELECT 1
            FROM source
            WHERE id = $1
        `;
        const existsResult: any = await db.select(existsQuery, [id]);

        if (existsResult.length > 0) {
            // Update the existing source
            const updateQuery = `
                UPDATE source
                SET domain = $1, icon = $2, title = $3, description = $4, version = $5
                WHERE id = $6
            `;
            await db.execute(updateQuery, [domain, icon, title, description, version, id]);
            return { code: 200, message: 'Source updated successfully' };
        } else {
            // Insert the new source
            const insertQuery = `
                INSERT INTO source (id, domain, icon, title, description, version)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await db.execute(insertQuery, [id, domain, icon, title, description, version]);
            return { code: 200, message: 'Source added successfully' };
        }
    } catch (error) {
        console.error(error);
        return { code: 500, message: JSON.stringify(error) };
    }
}


export async function remove_source({ id }: { id: string }): Promise<any> {
    try {
        await setupDatabase();
        
        // Load the SQLite database
        const db = await Database.load('sqlite:extension.db');

        // Check if the source exists
        const existsQuery = `
            SELECT 1
            FROM source
            WHERE id = $1
        `;
        const existsResult: any = await db.select(existsQuery, [id]);

        if (existsResult.length === 0) {
            return { code: 404, message: 'Source not found' };
        }

        // Remove the source
        const deleteQuery = `
            DELETE FROM source
            WHERE id = $1
        `;
        await db.execute(deleteQuery, [id]);

        return { code: 200, message: 'Source removed successfully' };
    } catch (error) {
        console.error('Error removing extension source:', error);
        return { code: 500, message: error };
    }
}

export async function get_source_info({ id }: { id: string }): Promise<any> {
    try {
        await setupDatabase();
        
        // Load the SQLite database
        const db = await Database.load('sqlite:extension.db');

        // Query to retrieve source information
        const query = `
            SELECT *
            FROM source
            WHERE id = $1
        `;
        const result: any = await db.select(query, [id]);

        if (result.length === 0) {
        return { code: 404, message: 'Source not found' };
        }

        return { code: 200, message: 'OK', data: result[0] };
    } catch (error) {
        console.error('Error fetching source information:', error);
        return { code: 500, message: error };
    }
}