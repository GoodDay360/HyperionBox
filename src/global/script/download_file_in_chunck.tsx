import axios from "axios";
import { writeFile, BaseDirectory} from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';

async function download_file_in_chunks({
    url = "",
    chunkSize = 1024 * 1024,
    output_file = "",
    callback = () => {}
}: any): Promise<any> {
    let start = 0;
    try {
        const headResponse = await fetch(url, { method: 'HEAD' });
        const totalSize = parseInt(headResponse.headers.get('content-length') as string, 10);

        while (start < totalSize) {
            const end = Math.min(start + chunkSize - 1, totalSize - 1);
            try {
                const response = await fetch(url, {
                    headers: { Range: `bytes=${start}-${end}` }

                });
                const data = await response.arrayBuffer();
                await writeFile(output_file, new Uint8Array(data), { baseDir: BaseDirectory.AppData, append: true });
                start = end + 1;
                callback({ current_size: start, total_size: totalSize });
                return {code: 200, message: "OK"};
            } catch (error) {
                console.error('Error downloading chunk:', error);
                return {code: 500, message: error};
            }
        }
    } catch (error) {
        console.error('Error getting file size:', error);
        return {code: 500, message: error};
        
    }
}


export default download_file_in_chunks;