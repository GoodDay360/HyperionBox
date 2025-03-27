import { writeFile, BaseDirectory, exists, remove} from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';

async function download_file_in_chunks({
    url = "",
    chunkSize = 3 * 1024 * 1024,
    output_file = "",
    callback = () => {}
}: any): Promise<any> {
    console.log(url)
    let start = 0;
    try {
        if (await exists(output_file)) await remove(output_file, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)})
        const headResponse = await fetch(url, { method: 'HEAD' });
        const totalSize = parseInt(headResponse.headers.get('content-length') as string, 10);

        while (start < totalSize) {
            const end = Math.min(start + chunkSize - 1, totalSize - 1);
            try {
                const response = await fetch(url, {
                    headers: { Range: `bytes=${start}-${end}` }

                });
                const data = await response.arrayBuffer();
                const write_response = await new Promise<any>(async(resolve,reject)=>{
                    writeFile(output_file, new Uint8Array(data), { baseDir: BaseDirectory.AppData, append: true })
                    .then(()=>{resolve({code:200,message:"OK"})})
                    .catch((e)=>reject({code:500,message:`[Error] Downlaod and write in chunk: ${e}`}))
                })
                if (write_response.code !== 200) return write_response;
                start = end + 1;
                callback({ current_size: start, total_size: totalSize });
                
            } catch (error) {
                console.error('Error downloading chunk:', error);
                return {code: 500, message: error};
            }
        }
        return {code: 200, message: "OK"};
    } catch (error) {
        console.error('Error getting file size:', error);
        return {code: 500, message: error};
        
    }
}


export default download_file_in_chunks;