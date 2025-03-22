
// React import
import { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router';

// Tauri Plugins
import { path } from '@tauri-apps/api';
import { exists,  readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { getCurrentWindow, LogicalSize, currentMonitor } from "@tauri-apps/api/window"

// Material UI 
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

// Import assets
import Icon from "../../assets/icons/icon.png"

// Import styles
import styles from "../styles/main.module.css";

// Custom imports
import check_node from '../scripts/check_node';
import check_7z from '../scripts/check_7z';
import check_extension_packages from '../scripts/check_extension_packages';
import { read_config, write_config } from '../../global/script/manage_config';

// Context Imports
import global_context from '../../global/script/contexts';





function Splash_Screen() {
    const navigate = useNavigate();

    const run_state = useRef<boolean>(false)
    const [feedback, setFeedback] = useState<any>({})
    const [progress, setProgress] = useState<any>({state:false,value:0})

    const { set_app_ready } = useContext<any>(global_context);

    useEffect(()=>{
        if(run_state.current) return;
        run_state.current = true;
        (async ()=>{
            await getCurrentWindow().setMaximizable(false);
            await getCurrentWindow().setResizable(false);
            await getCurrentWindow().setAlwaysOnTop(true);
            const monitor_size:any = (await currentMonitor())?.size;
            const new_height = monitor_size.height*0.5;
            const new_width = monitor_size.width*0.25;
            await getCurrentWindow().setSize(new LogicalSize(new_width, new_height));


            const config_path = await path.join(await path.appDataDir(),"config.json")
            const file_exist = await exists(config_path);
            if (!file_exist) await writeTextFile(config_path, "{}")
            
            let config = await read_config();

            setFeedback({text:"Checking manifest..."})

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
            
            if (manifest_response.code === 500) {
                setFeedback({text:`Failed to check manifest.`, color:"red"})
                run_state.current = false;
                return;
            }

            const check_bin:any = [
                {"7z": check_7z},
                {"node": check_node}

            ]

            if (!config.bin) config.bin = {};
            for (const item of check_bin){
                const key = Object.keys(item)[0]
                const callable:any = item[key]
                if (!config.bin[key]){
                    const result = await callable({manifest:manifest_response.data,setFeedback,setProgress});
                    if (result?.code === 200) {
                        config.bin[key] = true;
                        await write_config(config)
                    }else{
                        console.error(result)
                        setFeedback({text:`Error downloading ${key}`,color:"red"})
                        run_state.current = false
                        return;

                    }
                }
                setFeedback({text:`Download ${key} successfully.`})
            }


            if (!config.bin.extension_packages){
                const result = await check_extension_packages({setFeedback,setProgress});
                if (result?.code === 200) {
                    config.bin.extension_packages = true;
                    config.bin.browser_path = result.data.browser_path;
                    await write_config(config)
                }else{
                    console.error(result)
                    setFeedback({text:`Error downloading extension_packages`,color:"red"})
                    run_state.current = false
                    return;

                }
            }
            setFeedback({text:`Download extension_packages successfully.`})

            setFeedback({text:"Launching..."})
            
            await getCurrentWindow().setMaximizable(true);
            await getCurrentWindow().setResizable(true);
            await getCurrentWindow().setAlwaysOnTop(false);

            set_app_ready(true);
            run_state.current = false
        })();
        
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
