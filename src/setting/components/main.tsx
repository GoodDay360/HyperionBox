// Tauri Plugins


// React Import
import { useEffect, useState, useContext } from "react";


// MUI Imports
import { Button } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';

// MUI Icon Imports


// styles Import
import styles from "../styles/main.module.css";

// Custom Import
import {  global_context } from "../../global/scripts/contexts";
import { read_config, write_config } from "../../global/scripts/manage_config";
import shutdown_extension from '../../global/scripts/shutdown_extension';

let FIRST_RUN_TIMEOUT:any;

const Setting = () => {
    // const navigate = useNavigate();
    
    const {app_ready, set_menu} = useContext<any>(global_context)
    const [is_ready, set_is_ready] = useState<boolean>(false);
    const [feedback, set_feedback] = useState<any>({state:false,text:""})
    const [CONFIG_MANIFEST, SET_CONFIG_MANIFEST] = useState<any>({})

    const [repair_dependencies, set_repair_dependencies] = useState<any>({})

    useEffect(()=>{
        if (!app_ready) return;
        set_feedback({state:true,text:"Gathering info..."})
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            SET_CONFIG_MANIFEST(await read_config());
            set_is_ready(true);
        }, import.meta.env.DEV ? 1500 : 0);
		return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[app_ready])




    return (<>
        <div className={styles.container}>
            <>{!feedback.state || is_ready
                ? <>
                    <div className={styles.body_box_1}>
                        <fieldset className={styles.fieldset_box}>
                            <legend className="float-none w-auto">Dependencies</legend>
                            <div className={styles.item_box}>
                                <span className={styles.fieldset_text}>7z {CONFIG_MANIFEST?.bin?.["7z"] ? "Installed" : "Not Install"}</span>
                                <div className={styles.check_box_frame}>
                                    <span className={styles.fieldset_text}>Repair</span>
                                    <Checkbox  sx={{color: 'var(--color)'}}
                                        onClick={()=>{set_repair_dependencies({...repair_dependencies, "7z":true})}}
                                    />
                                </div>
                                
                            </div>
                            <div className={styles.item_box}>
                                <span className={styles.fieldset_text}>Node {CONFIG_MANIFEST?.bin?.["node"] ? "Installed" : "Not Install"}</span>
                                <div className={styles.check_box_frame}>
                                    <span className={styles.fieldset_text}>Repair</span>
                                    <Checkbox  sx={{color: 'var(--color)'}}
                                        onClick={()=>{set_repair_dependencies({...repair_dependencies, "node":true})}}
                                    />
                                </div>
                            </div>
                            <div className={styles.item_box}>
                                <span className={styles.fieldset_text}>Extension Package {CONFIG_MANIFEST?.bin?.["extension-package"] ? "Installed" : "Not Install"}</span>
                                <div className={styles.check_box_frame}>
                                    <span className={styles.fieldset_text}>Repair</span>
                                    <Checkbox  sx={{color: 'var(--color)'}}
                                        onClick={()=>{set_repair_dependencies({...repair_dependencies, "extension-package":true})}}
                                    />
                                </div>
                            </div>

                            <div className={styles.item_box}>
                                <TextField label="Puppeeteer Browser Path" variant="outlined" focused
                                    placeholder={CONFIG_MANIFEST?.bin?.browser_path}
                                    sx={{
                                        flex:1,
                                        input: { color: 'var(--color)'}, 
                                        textField: {color: 'var(--color)'},
                                        label:{color: 'var(--color)'}
                                    }}
                                    value={CONFIG_MANIFEST?.bin?.browser_path}
                                    onChange={(e)=>{
                                        SET_CONFIG_MANIFEST({...CONFIG_MANIFEST,bin:{...CONFIG_MANIFEST.bin,browser_path:e.target.value}})
                                    }}
                                />
                                <div className={styles.check_box_frame}>
                                    <span className={styles.fieldset_text}>Repair</span>
                                    <Checkbox  sx={{color: 'var(--color)'}}
                                        onClick={()=>{set_repair_dependencies({...repair_dependencies, browser_path:true})}}
                                    />
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    <div className={styles.body_box_2}>
                        <Button variant="contained" color="secondary"
                            onClick={async ()=>{
                                console.log(repair_dependencies);
                                const repair = repair_dependencies;
                                const config = await read_config();
                                if (!config.bin || !Object.keys(config.bin)) config.bin = {}

                                config.bin.browser_path = CONFIG_MANIFEST?.bin?.browser_path;

                                if (repair?.["7z"]){
                                    delete config?.bin?.["7z"];
                                }else if (repair?.["node"]){
                                    delete config?.bin?.["node"];
                                }else if (repair?.["extension-package"]){
                                    delete config?.bin?.["extension-package"];
                                }else if (repair?.["browser_path"]){
                                    delete config?.bin?.["browser_path"]
                                }
                                await write_config(config);
                                await shutdown_extension();
                                set_menu({state:false,path:""});
                            }}
                        
                        >Apply</Button>
                    </div>
                </>
                : <div className={styles.feedback_box}>
                    <span className={styles.feedback_text}>{feedback.text}</span>
                    <CircularProgress size="max(25pt, calc((100vw + 100vh)/2 * 0.0325))" />
                </div>
            }</>
        </div>
    </>)
}

export default Setting;