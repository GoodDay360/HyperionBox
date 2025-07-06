// Tauri Plugins


// React Import
import { useEffect, useState, useContext } from "react";


// MUI Imports
import { Button } from '@mui/material';
import TextField from '@mui/material/TextField';

// MUI Icon Imports



// Context Import
import { global_context } from "../../global/scripts/contexts";

// styles Import
import styles from "../styles/main.module.css";
import { write_config } from '../../global/scripts/manage_config';
import { request_current_task } from '../../global/scripts/manage_download';
import write_crash_log from '../../global/scripts/write_crash_log';
// Custom Import




const General = ({CONFIG_MANIFEST, SET_CONFIG_MANIFEST}:any) => {
    // const navigate = useNavigate();
    const {set_feedback_snackbar} = useContext<any>(global_context)

    const [max_download_thread, set_max_download_thread] = useState<string>(CONFIG_MANIFEST?.max_download_thread||"3");
        
    useEffect(()=>{
        ;(async () => {
            
        })()

    },[])


    return (
        <div className={styles.body_box}>
            <fieldset className={styles.fieldset_box}>
                <legend className={`float-none w-auto ${styles.legend_box}`}>General</legend>
                
                <div className={styles.item_box}>
                    <TextField label="Max Download Thread" variant="outlined" focused
                        placeholder={`Current: ${CONFIG_MANIFEST?.max_download_thread}, Min: 1`}
                        sx={{
                            flex:1,
                            input: { color: 'var(--color)'}, 
                            textField: {color: 'var(--color)'},
                            label:{color: 'var(--color)'}
                        }}
                        value={max_download_thread}
                        onChange={(e)=>{
                            if (!e.target.value) set_max_download_thread(e.target.value);
                            else set_max_download_thread(parseInt(e.target.value,10).toString());
                            
                        }}
                    />
                </div>


                <div className={styles.item_box_2}>
                    <Button variant="contained" color="secondary"
                        onClick={async ()=>{
                            if (parseInt(max_download_thread,10) !== CONFIG_MANIFEST?.max_download_thread){
                                const current_task_result = await request_current_task();
                                if (current_task_result.code !== 204){
                                    await write_crash_log("There current download task running, change max download thread is not allow.");
                                    console.error("There current download task running, change max download thread is not allow.");
                                    set_feedback_snackbar({state:true, type:"error", text:"Change [Max Download Thread] is only allow when there is no download task running."});
                                    return;
                                }
                            }
                            const new_config = {...CONFIG_MANIFEST,
                                max_download_thread:parseInt(max_download_thread,10)||3,
                            }
                            await write_config(new_config);
                            
                            set_max_download_thread((parseInt(max_download_thread,10)||3).toString());
                            SET_CONFIG_MANIFEST(new_config);
                            
                            set_feedback_snackbar({state:true, type:"info", text:"General settings updated successfully."});
                        }}
                    
                    >Apply</Button>
                </div>
            </fieldset>
        </div>
    )
}

export default General;