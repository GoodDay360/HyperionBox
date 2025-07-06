// Tauri Plugins

import { path } from '@tauri-apps/api';
import { platform, arch } from '@tauri-apps/plugin-os';
import { mkdir, exists, BaseDirectory, readFile, remove } from '@tauri-apps/plugin-fs';

// Custom Import
import execute_command from '../../global/scripts/execute_command';
import write_crash_log from '../../global/scripts/write_crash_log';
import get_node_dir from '../../global/scripts/node/get_node_dir';
import download_file_in_chunks from '../../global/scripts/download_file_in_chunk';
import get_7z_path from '../../global/scripts/get_7z_path';

const chunkSize = 6 * 1024 * 1024; 

const check_browser = async ({manifest, setFeedback, setProgress}:any) => {
    try{
        setFeedback({text:`Installing puppeteer browser... might take a while.`})
        const cwd = await path.join(await path.appDataDir(),"extension")


        
        let browser_path
        
        if (await platform() === "windows") {
            
            const url = manifest?.["browser"]?.[await platform()]?.[await arch()]?.url;
            if (!url) {
                setFeedback("Your system doesn't support this app.")
                return {code:500, message:"System not support."};
            }
            setFeedback({text:"Downloading browser..."})
            const bin_dir = await path.join(await path.appDataDir(),"bin")
            if (!await exists(bin_dir, {baseDir:BaseDirectory.AppData})) await mkdir(bin_dir, {baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});
            
            
            const temp_dir = await path.join(await path.tempDir(),"com.hyperionbox.app")
            await mkdir(temp_dir, {recursive:true,baseDir:BaseDirectory.Temp}).catch(e=>{console.error(e)})

            const output_file = await path.join(temp_dir, "firefox_installer.exe")

            let start_size = 0;
            if (await exists(output_file)) {
                const file = await readFile(output_file, {baseDir:BaseDirectory.Temp});
                start_size = file.byteLength;
            
            }
            await download_file_in_chunks({
                url, 
                start_size,
                chunk_size:chunkSize, 
                output_file:output_file,
                callback: ({current_size,total_size}:any) => {
                    setProgress({state:true,value:current_size*100/total_size})

                }
            });
            
            setProgress({state:false,value:0})

            setFeedback({text:"Extracting browser..."})

            const extract_dir = await path.join(await path.appDataDir(),"bin", "firebox")

            if (await exists(extract_dir, {baseDir:BaseDirectory.AppData})) await remove(extract_dir, {baseDir:BaseDirectory.AppData, recursive:true});

            await mkdir(extract_dir, {baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});
            
            const path_7z = await get_7z_path;
            let extract_command
            if (await platform() === "windows") {
                extract_command = `& "${path_7z}" x "${output_file}" -o"${extract_dir}" -aoa -md=32m -mmt=3`
            }else{
                extract_command = `"${path_7z}" x "${output_file}" -o"${extract_dir}" -aoa -md=32m -mmt=3`
            }
            
            const result = await execute_command({title:"extract",command:extract_command})


            if (result.stderr) {
                await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true}).catch(e=>{console.error(e)});
                return {code:500, message:result.stderr, at:"check_extension_package.tsx -> excute_command -> extract"}
            };


            if (await exists(output_file)) await remove(output_file, {baseDir:BaseDirectory.Temp, recursive:true});

            if (await exists(await path.join(extract_dir, "setup.exe"))) await remove(await path.join(extract_dir, "setup.exe"), {baseDir:BaseDirectory.AppData, recursive:true});

            browser_path = await path.join(extract_dir,"core","firefox.exe")

        }else{
            
            const node_dir = await get_node_dir;

            const command = [
                `export PATH="${node_dir}:$PATH"`, '&&',
                `npx @puppeteer/browsers install firefox@stable`
            ].join(' ');

        

            const execute_install_browser_response = await execute_command({title:"npx_install_puppeteer_browser",command, cwd})
            const stderr_result = execute_install_browser_response.stderr.trim()

            const stdout_splited = execute_install_browser_response.stdout.trim().split("\n")
            const path_result = stdout_splited[stdout_splited.length - 1].split(" ");
            path_result.shift();
            browser_path = path_result.join(" ").trim();
            
            console.log(browser_path);
            if (!browser_path) {
                await write_crash_log(`[Error check_browser] Unable to install puppeteer browser.`);
                console.error("[Error] check_browser: ", "Unable to install puppeteer browser.");
                return {code:500, message:"Unable to install puppeteer browser."};
            }

            if (stderr_result) {
                if (stderr_result.includes("npm notice")) {
                    return {code: 200, message: 'OK', browser_path}
                }else{
                    await write_crash_log(`[check_browser] npx install: ${JSON.stringify({code: 500, message: execute_install_browser_response.stderr})}`);
                    console.error(execute_install_browser_response.stderr);

                    return {code: 500, message: execute_install_browser_response.stderr};
                }
            }
        }
        
        return {code: 200, message: 'OK', browser_path}
        
    }catch(e:any){
        console.error("[Error] check_browser: ", e);
        return {code:500, message:e};
    }
}

export default check_browser;