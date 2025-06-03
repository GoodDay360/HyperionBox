
// React import
import { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router';

// Tauri Plugins
import { path } from '@tauri-apps/api';
import { exists, writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { getCurrentWindow, LogicalSize, currentMonitor } from "@tauri-apps/api/window"
import { platform, arch } from '@tauri-apps/plugin-os';

// Material UI 
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

// Semver Import
import semver from 'semver';


// Import assets
import Icon from "../../assets/images/icon.png"

// Import styles
import styles from "../styles/main.module.css";

// Custom imports
import check_node from '../scripts/check_node';
import check_7z from '../scripts/check_7z';
import check_yt_dlp from '../scripts/check_yt_dlp';
import check_ffmpeg from '../scripts/check_ffmpeg';
import check_extension_package from '../scripts/check_extension_package';
import initiate_extension from '../scripts/initiate_extension';
import write_crash_log from '../../global/scripts/write_crash_log';
import { read_config, write_config } from '../../global/scripts/manage_config';

// Context Imports
import { global_context } from '../../global/scripts/contexts';
import { stat } from 'fs';


let FIRST_RUN_TIMEOUT:any;
function Splash_Screen() {
    const navigate = useNavigate();

    const [feedback, setFeedback] = useState<any>({})
    const [progress, setProgress] = useState<any>({state:false,value:0})

    const { set_app_ready } = useContext<any>(global_context);


    useEffect(()=>{
        // The reason I use weird interval because of strict mode in development mode. Once use in production this won't effect the speed.
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            clearTimeout(FIRST_RUN_TIMEOUT);
            setFeedback({text:"Loading..."});
            const window = await getCurrentWindow();

            window.setMaximizable(false);
            window.setResizable(false);
            window.setAlwaysOnTop(true);
            const monitor_size:any = (await currentMonitor())?.size;
            const new_height = monitor_size.height*0.5;
            const new_width = monitor_size.width*0.25;
            window.setSize(new LogicalSize(new_width, new_height));


            
            try{
                const config_path = await path.join(await path.appDataDir(),"config.json")
                const file_exist = await exists(config_path);
                if (!file_exist) await writeTextFile(config_path, "{}")
                
                let config = await read_config();

                if (!import.meta.env.DEV || (import.meta.env.VITE_DEV_SKIP_BIN_VERIFICATION === "0")){

                    setFeedback({text:"Checking manifest..."});
                    
                    let manifest_data:any;

                    if (import.meta.env.DEV || import.meta.env.VITE_DEV_USE_LOCAL_BIN_MANIFEST === "1") {
                        try{
                            manifest_data = JSON.parse(await readTextFile(import.meta.env.VITE_DEV_LOCAL_BIN_MANIFEST_PATH));
                        }catch(e){
                            console.log("[MANIFEST] Error reading local manifest:",e);
                            await write_crash_log(`[MANIFEST] Error reading local manifest:${JSON.stringify(e)}`);
                            setFeedback({text:"Error reading local manifest.", color:"red"});
                            return;
                        }
                        
                    }else{
                        const manifest_response:any = await new Promise((resolve,reject) =>{
                            fetch(
                                "https://raw.githubusercontent.com/GoodDay360/HyperionBox/refs/heads/main/bin.manifest.json",
                                {method: "get"}
                            )
                            .then(async (response) => {
                                const node_manifest = (await response.json());
                                resolve({data:node_manifest, code:200})
                            })
                            .catch(error => {
                                console.error('Error fetching the data:', error);
                
                                reject({message:error, code:500})
                            });
                        })
                        
                        
                        if (manifest_response.code === 200) {
                            manifest_data = manifest_response.data;
                        }else{
                            setFeedback({text:`Failed to check manifest.`, color:"red"})
                            return;
                        }
                    }

                    const check_bin:any = [
                        {"7z": check_7z},
                        {"node": check_node},
                        // {"ffmpeg": check_ffmpeg},
                        // {"yt-dlp": check_yt_dlp},
                        {"extension-package": check_extension_package},

                    ]

                    if (!config.bin) config.bin = {};
                    for (const item of check_bin){
                        const key = Object.keys(item)[0]
                        const callable:any = item[key]
                        const availbe_version = manifest_data?.[key]?.[await platform()]?.[await arch()]?.version
                        if (!config.bin[key]?.state || !semver.valid(config.bin[key]?.version) || semver.lt(config.bin[key]?.version, availbe_version)){
                            const result = await callable({manifest:manifest_data,setFeedback,setProgress});
                            
                            if (result?.code === 200) {
                                config.bin[key] = {state:true,version:availbe_version};
                                if (key === "extension-package") {
                                    config.bin.browser_path = result.browser_path
                                }
                                await write_config(config)

                            }else{
                                console.error(result)
                                setFeedback({text:`Error downloading ${key}`,color:"red"})
                                return;

                            }
                        }
                        setFeedback({text:`Download ${key} successfully.`})
                    }
                }
                
                if (!import.meta.env.DEV || import.meta.env.VITE_DEV_SKIP_INITIATE_EXTENSION === "0"){
                    setFeedback({text:`Initiating extension...`})
                    const intiate_result = await initiate_extension();
                    if (intiate_result?.code !== 200) {
                        setFeedback({text:intiate_result.message,color:"red"});
                        return;
                    }
                    
                }

                setFeedback({text:"Launching..."});
                window.setMaximizable(true);
                window.setResizable(true);
                window.setAlwaysOnTop(false);

                set_app_ready(true);
            }catch(e){
                console.error(e)
                setFeedback({text:`Error: ${e}`,color:"red"})
                return;
            }

            
            


        }, import.meta.env.DEV ? 3000 : 0);

        return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[])

    return (
        <div className={styles.container}>
            <img src={Icon}
                className={styles.icon}
            />
            <div style={{display:"flex",flexDirection:"column"}}>
                <span className={styles.feedback} style={{color:feedback.color || "var(--color)"}}>{feedback.text}</span>
            </div>
            {progress.state &&
                (
                    <Box sx={{ width: '100%' }}>
                        <LinearProgress variant="determinate" value={progress.value} />
                    </Box>
                )
            }
        </div>
    );
}

export default Splash_Screen;
