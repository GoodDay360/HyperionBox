import { Parser } from 'm3u8-parser';
import { convertFileSrc } from '@tauri-apps/api/core';
import { path } from '@tauri-apps/api';
import { BaseDirectory, mkdir, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';

const reparse_local_hls = async ({input_file_path}:{input_file_path:string})=>{
    try{
        const cache_dir = await path.join(await path.appDataDir(), ".cache", "watch")
        mkdir(cache_dir, {recursive:true, baseDir:BaseDirectory.AppData}).catch((e) => { console.error(e) });
        const output_file = await path.join(cache_dir, "local_player.m3u8")

        const data = await readTextFile(input_file_path, {baseDir:BaseDirectory.AppData});
        // Parse the M3U8 content
        const parser = new Parser();
        parser.push(data);
        parser.end();
        const parsedManifest = parser.manifest;

        // Replace segment URIs with full URLs
        parsedManifest.segments.forEach((segment) => {
            segment.uri = convertFileSrc(segment.uri);
        });

        // Collect headers until the first #EXTINF tag
        const output_data:string[] = [];
        const splited = data.split("\n");
        let count_segment = 0;
        for (const line of splited) {
            if (!line || line[0].includes("#")) {
                output_data.push(line);
            }else{
                output_data.push(parsedManifest.segments[count_segment].uri);
                count_segment++;
            }
        }

        await writeTextFile(output_file, output_data.join("\n"), {baseDir:BaseDirectory.AppData}).catch((e) => { console.error(e) });

        return {code:200, message:"OK", result: convertFileSrc(output_file)}
    }catch(e:any){
        console.error("Error", e)
        console.error("Error message:", e.message);
        console.error("Stack trace:", e.stack);
        return {code:500, message:e}
    }
}

export default reparse_local_hls;