// Tauri Plugins


// React Import
import { useEffect, useState, useContext } from "react";


// MUI Imports
import { Button} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';


// MUI Icon Imports


// styles Import
import styles from "../styles/main.module.css";

// Custom Import
import {  global_context } from "../../global/scripts/contexts";
import { read_config } from "../../global/scripts/manage_config";
import shutdown_extension from '../../global/scripts/shutdown_extension';


// Component Import
import Dependencies from "./dependencies";
import Storage from "./storage";
import General from "./general";

let FIRST_RUN_TIMEOUT:any;

const Setting = () => {
    // const navigate = useNavigate();
    
    const {set_menu} = useContext<any>(global_context)
    const [is_ready, set_is_ready] = useState<boolean>(false);
    const [feedback, set_feedback] = useState<any>({state:false,text:""})
    
    const [CONFIG_MANIFEST, SET_CONFIG_MANIFEST] = useState<any>({})

    useEffect(()=>{
        set_feedback({state:true,text:"Gathering info..."})
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            SET_CONFIG_MANIFEST(await read_config());
            set_is_ready(true);
        }, import.meta.env.DEV ? 1500 : 0);
        return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[])

    return (<>
        <div className={styles.container}>
            <>{!feedback.state || is_ready
                ? <>
                    <General CONFIG_MANIFEST={CONFIG_MANIFEST} SET_CONFIG_MANIFEST={SET_CONFIG_MANIFEST}/>
                    <Dependencies CONFIG_MANIFEST={CONFIG_MANIFEST} SET_CONFIG_MANIFEST={SET_CONFIG_MANIFEST}/>
                    <Storage />

                    
                    <div className={styles.body_box_2}>
                        <Button variant="contained" color="error"
                            onClick={async ()=>{
                                await shutdown_extension();
                                set_menu({state:false,path:""});
                            }}
                        
                        >Restart</Button>
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