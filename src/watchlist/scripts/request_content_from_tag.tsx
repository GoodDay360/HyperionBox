import Database from '@tauri-apps/plugin-sql';
import { path } from '@tauri-apps/api';
import { exists } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';

const LIMIT = 15;

export const request_content_from_tag = async ({ tag_name, page }: { tag_name: string, page: number }) => {
    // Validate the tag name
    if (!tag_name.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/)) {
        return { code: 500, message: `Invalid tag name format.` };
    }

    // Load the database
    const db = await Database.load('sqlite:watchlist.db');

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
    const countQuery = `
        SELECT COUNT(*) as total
        FROM "${tableName}"
    `;
    const countResult: any = await db.select(countQuery);
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
    const maxPage = Math.ceil(totalRows / LIMIT);

    // Ensure the page number is valid
    if (page < 1 || page > maxPage) {
        return { code: 400, message: `Invalid page number. It should be between 1 and ${maxPage}.` };
    }

    // Calculate the offset based on the page number
    const offset = (page - 1) * LIMIT;

    // Retrieve paginated data
    const dataQuery = `
        SELECT *
        FROM "${tableName}"
        ORDER BY datetime DESC
        LIMIT $1 OFFSET $2
    `;
    const dataResult: any = await db.select(dataQuery, [LIMIT, offset]);

    for (const item of dataResult) {
        const preview_dir = await path.join(await path.appDataDir(), "data", item.source_id, item.preview_id);
        const cover_path = await path.join(preview_dir, "cover.jpg");
        if (await exists(cover_path)) item.cover = convertFileSrc(cover_path);
    }

    return {
        code: 200,
        message: `Data retrieved successfully.`,
        data: dataResult,
        max_page: maxPage,
    };
};



export default request_content_from_tag;