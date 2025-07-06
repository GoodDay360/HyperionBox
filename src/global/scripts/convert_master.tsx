
import { convertFileSrc } from "@tauri-apps/api/core";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { Parser } from 'm3u8-parser';

async function convert_master ({source, output}:{source:string, output:string}) {
    try{
        
        const master_content = await readTextFile(source);

        const parser = new Parser();
        parser.push(master_content);
        parser.end();
        const parsedManifest:any = parser.manifest;

        let replaced_url_list = []

        for (const player of parsedManifest.playlists) {
            replaced_url_list.push(convertFileSrc(player.uri));
        }

        let new_master_content_lines = [];

        let count = 0;
        for (const line of master_content.split("\n")) {
            if (line.charAt(0) === "#" || !line) {
                new_master_content_lines.push(line);
            } else {
                new_master_content_lines.push(replaced_url_list[count]);
                count ++;
            }
        }
        console.log("new_master_content_lines", new_master_content_lines.join("\n"));
        await writeTextFile(output, new_master_content_lines.join("\n"));
        return {code:200,message:"OK"}
    }catch(e:any){
        console.error(e);
        return {code:500,message:e}
    }
}

export default convert_master;