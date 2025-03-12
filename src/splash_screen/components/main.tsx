
// React import
import { useEffect, useState, useRef } from 'react';

// Tauri Plugins
import { Command } from '@tauri-apps/plugin-shell';
import { info, error } from '@tauri-apps/plugin-log';
import { path } from '@tauri-apps/api';
import { exists, open, BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

// Material UI 
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

// Import assets
import Icon from "../../assets/icons/icon.png"

// Import styles
import styles from "../styles/main.module.css";

// Custom imports
import { get_extensions_directory } from '../../global/script/get_extensions_directory';
import check_node from '../scripts/check_node';
import check_7z from '../scripts/check_7z';
import { fileURLToPath, pathToFileURL} from 'url'





function Splash_Screen() {
    const run_state = useRef<boolean>(false)
    const [feedback, setFeedback] = useState<any>({})
    const [progress, setProgress] = useState<any>({state:false,value:0})

    useEffect(()=>{
        if(run_state.current) return;
        run_state.current = true;
        (async ()=>{
            const config_path = await path.join(await path.appDataDir(),"config.json")
            const file_exist = await exists(config_path);
            if (!file_exist) await writeTextFile(config_path, "{}")
            readTextFile(config_path)
            .then(async (res)=>{
                let config
                try{
                    config = JSON.parse(res)
                }catch{
                    error("Invalid config file!")
                    await writeTextFile(config_path, "{}");
                    config = {}
                }

               

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
                console.log(manifest_response)
                if (manifest_response.code === 500) {
                    setFeedback({text:`Failed to check manifest.`, color:"red"})
                    run_state.current = false;
                    return;
                }

                const check_bin:any = [
                    {"7z": check_7z},
                    {"node": check_node}

                ]

                for (const item of check_bin){
                    if (!config.bin) config.bin = {};
                    const key = Object.keys(item)[0]
                    const callable:any = item[key]
                    if (!config.bin[key]){
                        const result = await callable({manifest:manifest_response.data,setFeedback,setProgress});
                        if (result?.code === 200) {
                            config.bin[key] = true;
                            await writeTextFile(config_path, JSON.stringify(config, null, 2))
                        }else{
                            console.error(result)
                            setFeedback({text:`Error downloading ${key}`,color:"red"})
                            run_state.current = false
                            return;

                        }
                    }
                    setFeedback({text:`Download ${key} successfully.`})
                }
                
                setFeedback({text:"Launching app..."})
                run_state.current = false
            }).catch((e)=> {
                console.error(e);
                run_state.current = false
            })
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
