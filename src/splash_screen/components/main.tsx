

// Tauri Plugins
import { Command } from '@tauri-apps/plugin-shell';
import { info, error } from '@tauri-apps/plugin-log';
import { path } from '@tauri-apps/api';
import { exists, open, BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

import { fileURLToPath, pathToFileURL} from 'url'


// Custom imports
import { get_extensions_directory } from '../../global/script/get_extensions_directory';
import check_node from '../scripts/check_node';

// Import assets
import Icon from "../../assets/icons/icon.png"
import { useEffect, useState } from 'react';
import { json } from 'stream/consumers';

// Import styles
import styles from "../styles/main.module.css";


function Splash_Screen() {
    const [feedback_1, setFeedback_1] = useState<string>("")
    const [feedback_2, setFeedback_2] = useState<string>("")

    useEffect(()=>{
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
                    check_node({setFeedback_1,setFeedback_2})
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
                <span className={styles.feedback_1}>{feedback_1}</span>
                <span className={styles.feedback_2}>{feedback_2}</span>
            </div>
            
            
        </div>
    );
}

export default Splash_Screen;
