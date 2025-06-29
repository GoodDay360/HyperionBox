// Tauri Plugins


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



const Dependencies = ({CONFIG_MANIFEST, SET_CONFIG_MANIFEST}:any) => {
    // const navigate = useNavigate();

    const {set_menu} = useContext<any>(global_context)
        

    const [repair_dependencies, set_repair_dependencies] = useState<any>({})

    
    return (
        <div className={styles.body_box}>
            <fieldset className={styles.fieldset_box}>
                <legend className={`float-none w-auto ${styles.legend_box}`}>Dependencies</legend>
                
                <div className={styles.item_box}>
                    <span className={styles.fieldset_text}>7z {CONFIG_MANIFEST?.bin?.["7z"] ? "Installed" : "Not Install"}</span>
                    <div className={styles.check_box_frame}>
                        
                        <Checkbox  sx={{color: 'var(--color)'}}
                            onClick={()=>{set_repair_dependencies({...repair_dependencies, "7z":true})}}
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
                            onClick={()=>{set_repair_dependencies({...repair_dependencies, "node":true})}}
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
                            onClick={()=>{set_repair_dependencies({...repair_dependencies, "extension-package":true})}}
                        />
                        <Tooltip title="Repair" arrow>
                            <span className={styles.fieldset_text}><HandymanRoundedIcon sx={{color: 'var(--color)'}} fontSize="inherit"/></span>
                        </Tooltip>
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
                        
                        
                        <Checkbox  sx={{color: 'var(--color)'}}
                            onClick={()=>{set_repair_dependencies({...repair_dependencies, browser_path:true})}}
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
            </fieldset>
        </div>
    )
}

export default Dependencies;