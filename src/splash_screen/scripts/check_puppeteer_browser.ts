import { path } from '@tauri-apps/api';

import execute_command from '../../global/scripts/excute_command';
import get_npx_path from '../../global/scripts/node/get_npx_path';
import write_crash_log from '../../global/scripts/write_crash_log';
import get_extension_directory from '../../global/scripts/get_extension_directory';

const check_puppeteer_browser = async ({setFeedback}:any) => {
    try{
        setFeedback({text:`Installing puppeteer browser... might take a while.`})
        const cwd = await path.join(await path.appDataDir(),"extension")

        const npx_path = await get_npx_path;
        const execute_install_browser_response = await execute_command({title:"npx_install_puppeteer_browser",command:`"${npx_path}" puppeteer browsers install firefox@stable`, cwd})
        const stderr_result = execute_install_browser_response.stderr.trim()
        if (stderr_result) {
            if (stderr_result.includes("npm notice")) {
                return {code: 200, message: 'OK'}
            }else{
                await write_crash_log(`[check_puppeteer_browser] npx install: ${JSON.stringify({code: 500, message: execute_install_browser_response.stderr})}`);
                console.error(execute_install_browser_response.stderr);

                return {code: 500, message: execute_install_browser_response.stderr};
            }
        }
        const path_result = execute_install_browser_response.stdout.trim().split("\n")[1].split(" ");
        path_result.shift();
        const browser_path = path_result.join(" ").trim();
        
        return {code: 200, message: 'OK', browser_path}
        
    }catch(e:any){
        console.error("[Error] check_extension_package: ", e);
        return {code:500, message:e};
    }
}

export default check_puppeteer_browser;