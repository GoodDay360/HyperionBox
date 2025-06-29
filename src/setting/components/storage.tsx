// Tauri Plugins
import { invoke } from '@tauri-apps/api/core';
import { path } from '@tauri-apps/api';

// React Import
import { useEffect, useState, useContext } from "react";


// MUI Imports
import { Button, Tooltip } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';

// MUI Icon Imports
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';

// styles Import
import styles from "../styles/main.module.css";

// Custom Import
import {  global_context } from "../../global/scripts/contexts";
import { read_config, write_config } from "../../global/scripts/manage_config";
import shutdown_extension from '../../global/scripts/shutdown_extension';



const Storage = ({}:any) => {
    // const navigate = useNavigate();

    const {set_menu} = useContext<any>(global_context)
        
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