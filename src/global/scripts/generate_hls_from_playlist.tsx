
import { convertFileSrc } from "@tauri-apps/api/core";
import { writeTextFile } from "@tauri-apps/plugin-fs";

async function generate_hls_from_playlist ({source, output}:{source:any, output:string}) {
    try{
        const bandwidthMap: { [key: string]: number } = {
            "1080p": 5000000,
            "720p": 3000000,
            "360p": 1000000,
        };

        const resolutionMap: { [key: string]: string } = {
            "1080p": "1920x1080",
            "720p": "1280x720",
            "360p": "640x360",
        };

        const playlistHeader = "#EXTM3U\n";
        const playlistContent = source
        .map((sourceItem:any) => {
            const bandwidth = bandwidthMap[sourceItem.quality] || 1000000;
            const resolution = resolutionMap[sourceItem.quality] || "640x360";
            return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${sourceItem.type === "local" ? convertFileSrc(sourceItem.uri) : sourceItem.uri}`;
        })
        .join("\n");

        const result = playlistHeader + playlistContent;
        await writeTextFile(output, result);
        return {code:200,message:"OK"}
    }catch(e:any){
        console.error(e);
        return {code:500,message:e}
    }
}

export default generate_hls_from_playlist;