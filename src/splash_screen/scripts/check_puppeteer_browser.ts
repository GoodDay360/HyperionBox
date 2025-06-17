import { path } from '@tauri-apps/api';
import { platform } from '@tauri-apps/plugin-os';
import execute_command from '../../global/scripts/execute_command';
import write_crash_log from '../../global/scripts/write_crash_log';
import get_node_dir from '../../global/scripts/node/get_node_dir';
const check_puppeteer_browser = async ({setFeedback}:any) => {
    try{
        setFeedback({text:`Installing puppeteer browser... might take a while.`})
        const cwd = await path.join(await path.appDataDir(),"extension")


        const node_dir = await get_node_dir;

        let command
        if (await platform() === "windows") {
            command = [
                `SET PATH="${node_dir}";%PATH%`, "\n",
                `npx @puppeteer/browsers install firefox@stable`
            ].join(" ")
        }else{
            // Require `gstreamer1.0-plugins-bad gstreamer1.0-plugins-good gstreamer1.0-libav`

            command = [
                `export PATH="${node_dir}:$PATH"`, '&&',
                `npx @puppeteer/browsers install firefox@stable`
            ].join(' ');

        }

        const execute_install_browser_response = await execute_command({title:"npx_install_puppeteer_browser",command, cwd})
        const stderr_result = execute_install_browser_response.stderr.trim()

        const stdout_splited = execute_install_browser_response.stdout.trim().split("\n")
        const path_result = stdout_splited[stdout_splited.length - 1].split(" ");
        path_result.shift();
        const browser_path = path_result.join(" ").trim();
        
        console.log(browser_path);
        if (!browser_path) {
            await write_crash_log(`[Error check_puppeteer_browser] Unable to install puppeteer browser.`);
            console.error("[Error] check_puppeteer_browser: ", "Unable to install puppeteer browser.");
            return {code:500, message:"Unable to install puppeteer browser."};
        }

        if (stderr_result) {
            if (stderr_result.includes("npm notice")) {
                return {code: 200, message: 'OK', browser_path}
            }else{
                await write_crash_log(`[check_puppeteer_browser] npx install: ${JSON.stringify({code: 500, message: execute_install_browser_response.stderr})}`);
                console.error(execute_install_browser_response.stderr);

                return {code: 500, message: execute_install_browser_response.stderr};
            }
        }
        
        return {code: 200, message: 'OK', browser_path}
        
    }catch(e:any){
        console.error("[Error] check_puppeteer_browser: ", e);
        return {code:500, message:e};
    }
}

export default check_puppeteer_browser;