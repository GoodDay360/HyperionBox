
// React import
import { useEffect, useState, useRef } from 'react';


// Tauri Plugins
import { Command } from '@tauri-apps/plugin-shell';
import { info, error } from '@tauri-apps/plugin-log';
import { path } from '@tauri-apps/api';
import { exists, open, BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

import { fileURLToPath, pathToFileURL} from 'url'


// Custom imports
import { get_extensions_directory } from '../../global/script/get_extensions_directory';
import check_node from '../scripts/check_node';
import check_7z from '../scripts/check_7z';

// Import assets
import Icon from "../../assets/icons/icon.png"

// Import styles
import styles from "../styles/main.module.css";



function Splash_Screen() {
    // const run_state = useRef<boolean>(false)
    const [feedback, setFeedback] = useState<any>({})

    useEffect(()=>{
        // if(run_state.current) return;
        // run_state.current = true;
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

                const check_bin:any = [
                    {"7z": check_7z},
                    // {"node": check_node}

                ]

                for (const item of check_bin){
                    if (!config.bin) config.bin = {};
                    const key = Object.keys(item)[0]
                    const callable:any = item[key]
                    if (!config.bin[key]){
                        // check_node({setFeedback})
                        const result = await callable({setFeedback});
                        if (result?.code === 200) {
                            config.bin[key] = true;
                            // await writeTextFile(config_path, JSON.stringify(config, null, 2))
                        }else{
                            setFeedback({text:`Error downloading ${key}`,color:"red"})
                            return;

                        }
                    }
                }
                


            }).catch((e)=> {info(e)})
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
            
            
        </div>
    );
}

export default Splash_Screen;
