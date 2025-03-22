import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, mkdir} from '@tauri-apps/plugin-fs';

// import JSZip from 'jszip';

import download_file_in_chunks from '../../global/script/download_file_in_chunk';
import get_npm_path from '../../global/script/node/get_npm_path';
import get_npx_path from '../../global/script/node/get_npx_path';
import execute_command from '../../global/script/excute_command';
import write_crash_log from '../../global/script/write_crash_log';

const chunkSize = 6 * 1024 * 1024; 

const check_extension_packages = async ({setFeedback, setProgress}:any) => {
    try{
        
        const download_response:any = await new Promise(async (resolve,reject) =>{
            const to_downlaod = [
                {
                    path: "package.json",
                    url: "https://raw.githubusercontent.com/GoodDay360/HyperionBox-Extensions/refs/heads/main/package.json"
                },
                {
                    path: "package-lock.json",
                    url: "https://raw.githubusercontent.com/GoodDay360/HyperionBox-Extensions/refs/heads/main/package-lock.json"
                },
                {
                    path: "route.js",
                    url: "https://raw.githubusercontent.com/GoodDay360/HyperionBox-Extensions/refs/heads/main/route.js"
                }
                
            ]

            const extension_dir = await path.join(await path.appDataDir(),"extension")
            if (!await exists(extension_dir)) await mkdir(extension_dir, {baseDir:BaseDirectory.AppData})
            for (const item of to_downlaod) {
                setFeedback({text:`Downloading ${item.path}...`})
                const download = await download_file_in_chunks({
                    chunkSize:chunkSize,url:item.url, output_file:await path.join(extension_dir, item.path), 
                    callback: ({current_size,total_size}:any) => {
                        setProgress({state:true,value:current_size*100/total_size})
                    }
                })
                if (download.code !== 200) {
                    reject(download);
                    break;
                };
            };
            const npm_path = await get_npm_path;
            setFeedback({text:`Installing extension packages... might take a while.`})
            const execute_install_npm_response = await execute_command({title:"npm-install",command:`"${npm_path}" install`,cwd:extension_dir})
            if (execute_install_npm_response.stderr.trim()) {
                await write_crash_log(`[check_extension_packages] npm install: ${JSON.stringify({code: 500, message: execute_install_npm_response.stderr})}`);
                reject({code: 500, message: execute_install_npm_response.stderr});
            }
            
            setFeedback({text:`Installing puppeteer browser... might take a while for first time.`})
            const npx_path = await get_npx_path;
            const execute_install_browser_response = await execute_command({title:"npx-install",command:`"${npx_path}" puppeteer browsers install firefox@stable`,cwd:extension_dir})
            if (execute_install_browser_response.stderr.trim()) {
                await write_crash_log(`[check_extension_packages] npx install: ${JSON.stringify({code: 500, message: execute_install_browser_response.stderr})}`);
                reject({code: 500, message: execute_install_browser_response.stderr});
                console.error({code: 500, message: execute_install_browser_response.stderr});
            }
            const path_result = execute_install_browser_response.stdout.trim().split("\n")[1].split(" ");
            path_result.shift();
            const browser_path = path_result.join(" ").trim();

            resolve({code: 200, message: 'OK', data: {browser_path}});
        })
        setProgress({state:false,value:0})

        return download_response;
    }catch{(e:unknown)=>{
        console.error("[Error] check_extension_packages: ", e);
        return {code:500, message:e};
    }}
}

export default check_extension_packages;