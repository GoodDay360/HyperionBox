
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

import { json } from 'stream/consumers';

// Import styles
import styles from "../styles/main.module.css";



function Splash_Screen() {
    // const run_state = useRef<boolean>(false)
    const [feedback, setFeedback] = useState<string>("")

    useEffect(()=>{
        // if(run_state.current) return;
        // run_state.current = true;
        (async ()=>{
            const config_path = await path.join(await path.appDataDir(),"config.json")
            const file_exist = await exists(config_path);
            if (!file_exist) await writeTextFile(config_path, "{}")
            readTextFile(config_path)
            .then(async (res)=>{
                info(res)
                let config
                try{
                    config = JSON.parse(res)
                }catch{
                    error("Invalid config file!")
                    await writeTextFile(config_path, "{}");
                    config = {}
                }

                if (!config.first_load){
                    // check_node({setFeedback})
                    check_7z({setFeedback})

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
                <span className={styles.feedback}>{feedback}</span>
            </div>
            
            
        </div>
    );
}

export default Splash_Screen;
