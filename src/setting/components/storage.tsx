// Tauri Plugins
import { invoke } from '@tauri-apps/api/core';
import { path } from '@tauri-apps/api';

// React Import
import { useEffect } from "react";


// MUI Imports


// MUI Icon Imports


// styles Import
import styles from "../styles/main.module.css";

// Custom Import




const Storage = ({}:any) => {
    // const navigate = useNavigate();

    // const {set_menu} = useContext<any>(global_context)
        
    useEffect(()=>{
        ;(async () => {
            const size = await invoke<number>('get_folder_size', { path: await path.join(await path.appDataDir(), "data") });
            console.log(`Folder size: ${size} bytes`);
        })()

    },[])


    return (
        <div className={styles.body_box}>
            <fieldset className={styles.fieldset_box}>
                <legend className={`float-none w-auto ${styles.legend_box}`}>Storage</legend>
                
            </fieldset>
        </div>
    )
}

export default Storage;