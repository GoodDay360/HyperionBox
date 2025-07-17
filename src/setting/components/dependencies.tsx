// Tauri Plugins
import { relaunch } from '@tauri-apps/plugin-process';

// React Import
import { useState } from "react";


// MUI Imports
import { Button, Tooltip } from '@mui/material';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';

// MUI Icon Imports
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';

// styles Import
import styles from "../styles/main.module.css";

// Custom Import
import { read_config, write_config } from "../../global/scripts/manage_config";
import shutdown_extension from '../../global/scripts/shutdown_extension';



const Dependencies = ({CONFIG_MANIFEST, SET_CONFIG_MANIFEST}:any) => {
    // const navigate = useNavigate();

        

    const [repair_dependencies, set_repair_dependencies] = useState<any>({})

    
    return (
        <div className={styles.body_box}>
            <fieldset className={styles.fieldset_box}>
                <legend className={`float-none w-auto ${styles.legend_box}`}>Dependencies</legend>
                
                <div className={styles.item_box}>
                    <span className={styles.fieldset_text}>7z {CONFIG_MANIFEST?.bin?.["7z"] ? "Installed" : "Not Install"}</span>
                    <div className={styles.check_box_frame}>
                        
                        <Checkbox  sx={{color: 'var(--color)'}}
                            onClick={(event:any)=>{set_repair_dependencies({...repair_dependencies, "7z":event.target.checked})}}
                        />
                        <Tooltip title="Repair" arrow>
                            <span className={styles.fieldset_text}><HandymanRoundedIcon sx={{color: 'var(--color)'}} fontSize="inherit"/></span>
                        </Tooltip>
                    </div>
                    
                </div>
                <div className={styles.item_box}>
                    <span className={styles.fieldset_text}>Node {CONFIG_MANIFEST?.bin?.["node"] ? "Installed" : "Not Install"}</span>
                    <div className={styles.check_box_frame}>
                        
                        <Checkbox  sx={{color: 'var(--color)'}}
                            onClick={(event:any)=>{set_repair_dependencies({...repair_dependencies, "node":event.target.checked})}}
                        />
                        <Tooltip title="Repair" arrow>
                            <span className={styles.fieldset_text}><HandymanRoundedIcon sx={{color: 'var(--color)'}} fontSize="inherit"/></span>
                        </Tooltip>
                    </div>
                </div>
                <div className={styles.item_box}>
                    <span className={styles.fieldset_text}>Extension Package {CONFIG_MANIFEST?.bin?.["extension-package"] ? "Installed" : "Not Install"}</span>
                    <div className={styles.check_box_frame}>
                        
                        <Checkbox  sx={{color: 'var(--color)'}}
                            onClick={(event:any)=>{set_repair_dependencies({...repair_dependencies, "extension-package":event.target.checked})}}
                        />
                        <Tooltip title="Repair" arrow>
                            <span className={styles.fieldset_text}><HandymanRoundedIcon sx={{color: 'var(--color)'}} fontSize="inherit"/></span>
                        </Tooltip>
                    </div>
                </div>

                <div className={styles.item_box}>
                    <TextField label="Puppeeteer Browser Path" variant="outlined" focused
                        placeholder={CONFIG_MANIFEST?.bin?.browser?.path}
                        sx={{
                            flex:1,
                            input: { color: 'var(--color)'}, 
                            textField: {color: 'var(--color)'},
                            label:{color: 'var(--color)'}
                        }}
                        value={CONFIG_MANIFEST?.bin?.browser?.path}
                        onChange={(e)=>{
                            SET_CONFIG_MANIFEST({...CONFIG_MANIFEST,bin:{...CONFIG_MANIFEST.bin,browser:{state: e.target.value?true:false, path:e.target.value}}})
                        }}
                    />
                    <div className={styles.check_box_frame}>
                        
                        
                        <Checkbox  sx={{color: 'var(--color)'}}
                            onClick={(event:any)=>{set_repair_dependencies({...repair_dependencies, browser:event.target.checked})}}
                        />
                        <Tooltip title="Repair" arrow>
                            <span className={styles.fieldset_text}><HandymanRoundedIcon sx={{color: 'var(--color)'}} fontSize="inherit"/></span>
                        </Tooltip>
                    </div>
                </div>
                <div className={styles.item_box_2}>
                    <Button variant="contained" color="secondary"
                        onClick={async ()=>{
                            console.log(repair_dependencies);
                            const repair = repair_dependencies;
                            const config = await read_config();
                            if (!config.bin || !Object.keys(config.bin)) config.bin = {}

                            if (config.bin.browser?.state) {
                                config.bin.browser.path = CONFIG_MANIFEST?.bin?.browser.path;
                            }
                            
                            if (repair?.["7z"]){
                                delete config?.bin?.["7z"];
                            }
                            if (repair?.["node"]){
                                delete config?.bin?.["node"];
                            }
                            if (repair?.["extension-package"]){
                                delete config?.bin?.["extension-package"];
                            }
                            if (repair?.["browser"]){
                                delete config?.bin?.["browser"]
                            }
                            await write_config(config);
                            await shutdown_extension();
                            await relaunch();
                        }}
                    
                    >Apply</Button>
                </div>
            </fieldset>
        </div>
    )
}

export default Dependencies;