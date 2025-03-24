
// Tauri Import
import { path } from '@tauri-apps/api';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { readTextFile, exists, BaseDirectory, mkdir, remove } from '@tauri-apps/plugin-fs';

// Custom Imports
import execute_command from "../../global/scripts/excute_command"
import get_extension_directory from "../../global/scripts/get_extension_directory"
import get_node_path from "../../global/scripts/node/get_node_path"

let port:any = null;
let executor:any;
await getCurrentWindow().onCloseRequested(async (event) => {
    executor.kill();
    let pid = null;
    if (port){
        const command = `netstat -ano | findstr :${port}`;
        const result = await execute_command({command:command, title:"get_extension_pid"});
        const lines = result.stdout.trim().split('\n');

        for (const line of lines.reverse()){
            const validOptions = ['LISTENING'];
            for (const option of validOptions) {
                if (line.includes(option)) {
                    pid = line.trim().split(/\s+/).at(-1);
                    console.log(line.trim().split(/\s+/))
                    console.log(pid);
                    const kill_command = `taskkill /PID ${pid} /F`;
                    console.log(kill_command)
                    await execute_command({command:kill_command, title:"kill_extension_process"});
                    break
                };
            }
        }
    }
});

const initiate_extension = async () => {
    const extension_directory = await get_extension_directory;
    const node_path = await get_node_path;
    const extension_log_dir = await path.join(await path.appDataDir(), "log", "extension")
    if (!await exists(extension_log_dir)) await mkdir(extension_log_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
    const log_path = await path.join(extension_log_dir, "initiate_extension_result.json");
    if (await exists(log_path)) await remove(log_path, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
    const route_path = await path.join(extension_directory, "route.js");
    const command = [
        `"${node_path}"`, `"${route_path}"`,
        "--log_path", `"${log_path}"`
    ].join(" ")

    executor = await execute_command({command:command, title:"initiate_extension",wait:false},{cwd:extension_directory});

    const max_check = 10
    let current_check = 0;
    const get_port = () => new Promise(async (resolve) => {
        if (current_check >= max_check) {
            resolve(0);
            return;
        }
        if (!(await exists(log_path))) {
            setTimeout(async () => {resolve(await get_port())}, 1000);
            current_check += 1;
            return
        }
        readTextFile(log_path, {baseDir:BaseDirectory.AppData})
        .then((res) => {
            if (res.trim()) {
                console.log(JSON.parse(res).port);
                resolve(JSON.parse(res).port);
            }else{
                current_check += 1;
                setTimeout(async () => {resolve(await get_port())}, 1000);
            }
        })
    })
    port = await get_port();
    if (port) {
        sessionStorage.setItem("extension_port", port);
        return {code:200, message:"OK", port:port}
    }else {
        console.error({code:500, message:"Failed to initiate extension"})
        return {code:500, message:"Failed to initiate extension"}
    }
}


export default initiate_extension;