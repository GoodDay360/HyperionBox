
// Tauri Import
import { path } from '@tauri-apps/api';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { readTextFile, exists, BaseDirectory, mkdir, remove } from '@tauri-apps/plugin-fs';
import { platform } from '@tauri-apps/plugin-os';
// Custom Imports
import execute_command from "../../global/scripts/execute_command"
import get_extension_directory from "../../global/scripts/get_extension_directory"
import get_node_dir from '../../global/scripts/node/get_node_dir';
import { read_config, write_config } from '../../global/scripts/manage_config';
import write_crash_log from '../../global/scripts/write_crash_log';
import shutdown_extension from '../../global/scripts/shutdown_extension';

let port:any = null;
getCurrentWindow().onCloseRequested(async () => {
    if (port){
        await shutdown_extension();
    }
});

const initiate_extension = async () => {
    const config = await read_config();
    if (!config.extension_port){
        config.exstension_port = 49152;
        await write_config(config);
    };
    sessionStorage.setItem("extension_port", config.exstension_port);

    const request_shutdown_result = await shutdown_extension();
    
    if (request_shutdown_result.code === 200){
        const message = "Seem like last session is not shutdown properly and it forcefully reconfigured.\nPlease restart the app."
        await write_crash_log(message);
        return {code:500, message};
    }

    const extension_directory = await get_extension_directory;
    
    const extension_log_dir = await path.join(await path.appDataDir(), "log", "extension")
    if (!await exists(extension_log_dir)) await mkdir(extension_log_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
    const log_path = await path.join(extension_log_dir, "initiate_extension_result.json");
    if (await exists(log_path)) await remove(log_path, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
    const route_path = await path.join(extension_directory, "route.js");
    
   
    const node_dir = await get_node_dir;
    let command
    if (await platform() === "windows") {
        command = [
            `SET PATH="${node_dir}";%PATH%`, "\n",
            `node`, `"${route_path}"`,
            "--log_path", `"${log_path}"`,
            "--port", `"${config.exstension_port}"`,
            "--browser_path", `"${config.bin.browser_path}"`
        ].join(" ")
    }else{
        command = [
            `export PATH="${node_dir}:$PATH"`, '&&',
            `node`, `"${route_path}"`,
            "--log_path", `"${log_path}"`,
            "--port", `"${config.exstension_port}"`,
            "--browser_path", `"${config.bin.browser_path}"`
        ].join(' ');

    }

    await execute_command({command:command, title:"initiate_extension",wait:false},{cwd:extension_directory});

    // Waiting for extension to load before continous
    const max_check = 30
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
        console.log({code:200, message:"OK", port:port})
        return {code:200, message:"OK", port:port}
    }else {
        await write_crash_log("Failed to initiate extension");
        console.error({code:500, message:"Failed to initiate extension"})
        return {code:500, message:"Failed to initiate extension"}
    }
    // =====================
}


export default initiate_extension;