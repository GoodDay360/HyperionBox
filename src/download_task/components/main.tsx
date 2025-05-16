// React Import
import { useEffect, useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router";

// MUI Imports


// styles Import
import styles from "../styles/main.module.css";

// Component Import
import RenderItem from "./render_item";

// Custom Import
import write_crash_log from "../../global/scripts/write_crash_log";
import { download_task_context, global_context } from "../../global/scripts/contexts";

import { request_download_task } from "../../global/scripts/manage_download";


let FIRST_RUN_TIMEOUT:any;

const DownloadTask = () => {
    const navigate = useNavigate();
    const {download_task_info} = useContext<any>(download_task_context)
    const {app_ready} = useContext<any>(global_context)
    const [feedback, set_feedback] = useState<any>({state:false,text:""})
    const [DOWNLOAD_TASK_DATA, SET_DOWNLOAD_TASK_DATA] = useState<any>([])

    const get_data = async ()=>{
        const request_download_task_result = await request_download_task()
        if (request_download_task_result.code === 200 && request_download_task_result.data.length > 0){
            SET_DOWNLOAD_TASK_DATA(request_download_task_result.data)
            set_feedback({state:false})
        }else{
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
        console.log("Current downlaod info: ", download_task_info);
    },[download_task_info])

    const RenderItemComponent = useCallback(({item}:any)=>{
        return <RenderItem item={item}/>;
    },[])

    return (<>
        <div className={styles.container}>
            <>{!feedback.state
                ? <div className={styles.body}>
                    <>{DOWNLOAD_TASK_DATA.length > 0
                        ? DOWNLOAD_TASK_DATA.map((item:any,index:number)=>(
                            <RenderItemComponent key={index} item={item}/>
                        ))
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