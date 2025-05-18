import { Parser } from 'm3u8-parser';
import { convertFileSrc } from '@tauri-apps/api/core';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readDir, exists, remove, mkdir, readFile, writeTextFile, readTextFile} from '@tauri-apps/plugin-fs';

const rephrase_local_hls = async ({input_file_path}:{input_file_path:string})=>{
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
        const headerLines = [];
        const splited = data.split("\n");
        for (const line of splited) {
        if (line.includes("#EXTINF")) break;
            headerLines.push(line);
        }

        const headers = headerLines.join("\n");

        // Build the modified M3U8 content
        let outputdata = headers + "\n";

        parsedManifest.segments.forEach((segment) => {
            outputdata += `#EXTINF:${segment.duration},\n${segment.uri}\n`;
        });

        if (parsedManifest.endList) outputdata += `#EXT-X-ENDLIST\n`;

        await writeTextFile(output_file, outputdata, {baseDir:BaseDirectory.AppData}).catch((e) => { console.error(e) });

        return {code:200, message:"OK", result: convertFileSrc(output_file)}
    }catch(e:any){
        console.error("Error", e)
        console.error("Error message:", e.message);
        console.error("Stack trace:", e.stack);
        return {code:500, message:e}
    }
}

export default rephrase_local_hls;