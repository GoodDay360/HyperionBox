// React Import
import { useEffect, useState, useCallback, useContext } from "react";


// MUI Imports
import { ButtonBase } from '@mui/material';

// MUI Icon Imports
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';

// styles Import
import styles from "../styles/main.module.css";

// Component Import
import RenderItem from "./render_item";

// Custom Import
import { download_task_context, global_context } from "../../global/scripts/contexts";
import { read_config, write_config } from "../../global/scripts/manage_config";
import { request_download_task } from "../../global/scripts/manage_download";


let FIRST_RUN_TIMEOUT:any;

const DownloadTask = () => {
    // const navigate = useNavigate();
    const {pause_download_task, download_task_info} = useContext<any>(download_task_context)
    const [task_info, set_task_info] = useState<any>({})
    const {app_ready} = useContext<any>(global_context)
    const [feedback, set_feedback] = useState<any>({state:false,text:""})
    const [DOWNLOAD_TASK_DATA, SET_DOWNLOAD_TASK_DATA] = useState<any>([])
    const [pause_task, set_pause_task] = useState<boolean>(pause_download_task.current)

    const get_data = async ()=>{
        const request_download_task_result = await request_download_task()
        if (request_download_task_result.code === 200 && request_download_task_result.data.length > 0){
            const sorted_data = [...request_download_task_result.data];
            sorted_data.sort((_: any, b: any) => (
                (task_info?.source_id === b?.source_id && 
                task_info?.season_id === b?.season_id && 
                task_info?.preview_id === b?.preview_id)
                ? 1 : -1
            ))
            SET_DOWNLOAD_TASK_DATA(sorted_data)
            
            set_feedback({state:false})
        }else{
            SET_DOWNLOAD_TASK_DATA([])
            set_feedback({state:true,text:"No task found."})
        }
        
    }

    useEffect(()=>{
        if (!app_ready) return;
        set_feedback({state:true,text:"Gathering info..."})
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            await get_data();
        }, import.meta.env.DEV ? 1500 : 0);
		return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[app_ready])

    useEffect(()=>{
        get_data();
        
    },[task_info])

    useEffect(() => {
        const interval = setInterval(() => {
            set_pause_task(pause_download_task.current);
            
            let need_update = false;
            for (const key of Object.keys(download_task_info.current)){
                if (task_info[key] !== download_task_info.current[key]){
                    need_update = true;
                    break;
                }
            }

            if (Object.keys(download_task_info.current).length === 0 && Object.keys(task_info).length !== 0) need_update = true;

            if (need_update) set_task_info(download_task_info.current);
        }, 800);
        return () => {
            
            clearInterval(interval)
        };
    }, [task_info]);

    const RenderItemComponent = useCallback(({item, get_data}:any)=>{
        return <RenderItem item={item} get_data={get_data}/>;
    },[DOWNLOAD_TASK_DATA])

    return (<>
        <div className={styles.container}>
            <>{!feedback.state
                ? <div className={styles.body}>
                    
                    <>{DOWNLOAD_TASK_DATA.length > 0
                        ? <>
                            <div className={styles.option_container}>
                                <ButtonBase 
                                    sx={{
                                        color:"var(--color)",
                                        fontSize:"calc((100vw + 100vh)*0.0225/2)",
                                        borderRadius:"5px",
                                        padding:"5px",
                                        border:`1px solid ${pause_task ? "green" : "red"}`,
                                    }}
                                    onClick={async ()=>{
                                        const config = await read_config();
                                        config.pause_download_task = !pause_task;
                                        await write_config(config);
                                        pause_download_task.current = !pause_download_task.current;
                                        set_pause_task(!pause_task);
                                        
                                    }}
                                >
                                    <>{pause_task
                                        ? <span style={{color:"green"}}><PlayCircleOutlineRoundedIcon sx={{fontSize:"calc((100vw + 100vh)*0.0325/2)"}}/> Resume</span>
                                        : <span style={{color:"red"}}><PauseCircleOutlineRoundedIcon sx={{fontSize:"calc((100vw + 100vh)*0.0325/2)"}}/> Pause</span>
                                    }</>
                                    
                                
                                </ButtonBase>
                            </div>
                            <>{DOWNLOAD_TASK_DATA.map((item:any,index:number)=>(
                                <RenderItemComponent key={index} item={item} get_data={get_data}/>
                            ))}</>
                        </>
                        :<></>

                    }</>
                </div>
                : <div className={styles.feedback_box}>
                    <span className={styles.feedback_text}>{feedback.text}</span>
                </div>
            }</>
        </div>
    </>)
}

export default DownloadTask;