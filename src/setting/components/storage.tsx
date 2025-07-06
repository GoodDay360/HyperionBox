// Tauri Plugins
import { invoke } from '@tauri-apps/api/core';
import { path } from '@tauri-apps/api';

// React Import
import { useEffect, useState, useContext } from "react";


// MUI Imports
import { Button } from '@mui/material';

// MUI Icon Imports
import CircularProgress from '@mui/material/CircularProgress';


// Context Import
import { global_context } from "../../global/scripts/contexts";

// styles Import
import styles from "../styles/main.module.css";

// Custom Import
import { format_size, clean_up_cache, clean_up_download } from '../scripts/storage';



const Storage = ({}:any) => {
    // const navigate = useNavigate();

    const {set_allow_use_app, set_feedback_snackbar} = useContext<any>(global_context)

    const [is_cleaning_up, set_is_cleaning_up] = useState<boolean>(false);

    const [SIZE, SET_SIZE] = useState<any>({unit:"B",value:0})
        
    useEffect(()=>{
        ;(async () => {
            const size = await invoke<number>('get_folder_size', { path: await path.join(await path.appDataDir(), "data") });
            SET_SIZE(format_size(size))
        })()

    },[])


    return (
        <div className={styles.body_box}>
            <fieldset className={styles.fieldset_box}>
                <legend className={`float-none w-auto ${styles.legend_box}`}>Storage</legend>
                <div className={styles.item_box}>
                    <span className={styles.fieldset_text}><span style={{fontFamily:"var(--font-family-bold)"}}>Local Data: </span>{SIZE.value} {SIZE.unit}</span>
                </div>

                <div className={styles.item_box}>
                    <>{is_cleaning_up
                        ? <CircularProgress color="secondary" size="calc((100vw + 100vh)*0.035/2)"/>
                        : <div style={{display:"flex", flexDirection:"row", gap:"8px"}}>
                            <Button variant="contained" color="secondary"
                                onClick={async ()=>{
                                    set_feedback_snackbar({state:true, type:"info", text:"Cleaning up cache..."});
                                    set_allow_use_app(false);
                                    set_is_cleaning_up(true);
                                    try{
                                        await clean_up_cache();
                                    }catch(e){
                                        console.error(e);
                                        
                                    }finally{
                                        set_is_cleaning_up(false);
                                        set_allow_use_app(true);
                                        const size = await invoke<number>('get_folder_size', { path: await path.join(await path.appDataDir(), "data") });
                                        SET_SIZE(format_size(size))
                                    }
                                    set_feedback_snackbar({state:true, type:"info", text:"Clean up completed."});
                                }}
                            
                            >Clean Up Cache</Button>

                            <Button variant="contained" color="error"
                                onClick={async ()=>{
                                    set_feedback_snackbar({state:true, type:"info", text:"Cleaning up download..."});
                                    set_allow_use_app(false);
                                    set_is_cleaning_up(true);
                                    try{
                                        await clean_up_download();
                                    }catch(e){
                                        console.error(e);
                                        
                                    }finally{
                                        set_is_cleaning_up(false);
                                        set_allow_use_app(true);
                                        const size = await invoke<number>('get_folder_size', { path: await path.join(await path.appDataDir(), "data") });
                                        SET_SIZE(format_size(size))
                                    }
                                    set_feedback_snackbar({state:true, type:"info", text:"Clean up completed."});
                                }}
                            
                            >Clean Up Download</Button>
                        </div>
                    }</>
                </div>

            </fieldset>
        </div>
    )
}

export default Storage;