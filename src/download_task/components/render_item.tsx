// React Import
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";

// Tauri Import
import {  readTextFile, exists, remove, BaseDirectory } from "@tauri-apps/plugin-fs"
import { path } from "@tauri-apps/api"
import { convertFileSrc } from '@tauri-apps/api/core';

// MUI Imports
import { ButtonBase, Tooltip } from "@mui/material";
import LinearProgress from '@mui/material/LinearProgress';

// MUI Icons Import
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';

// Lazy Load Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Context Import
import { download_task_context } from "../../global/scripts/contexts";

// Custom Import
import {  request_remove_download_task, request_set_error_task } from "../../global/scripts/manage_download";
import { get_data_storage_dir } from "../../global/scripts/manage_data_storage_dir";

// styles Import
import styles from "../styles/render_item.module.css";

const RenderItem = ({item, get_data}:any) => {
    const source_id = item.source_id;
    const preview_id = item.preview_id;
    const season_id = item.season_id;
    const type_schema = item.type_schema;
    
    

    const navigate = useNavigate();
    
    const {pause_download_task, download_task_info, download_task_progress} = useContext<any>(download_task_context)

    const [ITEM_DATA, SET_ITEM_DATA] = useState<any>(item.data);
    const [allow_manage, set_allow_manage] = useState<boolean>(true);
    const [cover, set_cover] = useState<string>("");
    const [title, set_title] = useState<string>("");
    const [task_info, set_task_info] = useState<any>(download_task_info.current);
    const [progress_info, set_progress_info] = useState<any>({percent:0});
    const [pause_task, set_pause_task] = useState<boolean>(pause_download_task.current);

    const [show_content, set_show_content] = useState<boolean>(true);

    useEffect(() => {
        const interval = setInterval(() => {
            set_pause_task(pause_download_task.current);
            set_task_info(download_task_info.current);
            if (Object.keys(download_task_progress.current).length === 0) return;
            // console.log("cute", download_task_progress.current)
            set_progress_info(download_task_progress.current);

        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(()=>{
        
    },[task_info])

    useEffect(()=>{
        ;(async ()=>{
            const DATA_DIR = await get_data_storage_dir();
            const preview_dir = await path.join(DATA_DIR, source_id, preview_id)
            const cover_path = await path.join(preview_dir,"cover.jpg")
            if (await exists(cover_path)){
                set_cover(convertFileSrc(cover_path))
            }

            const manifest_path = await path.join(preview_dir, "manifest.json");
            if (await exists(manifest_path)){
                try{
                    const manifest = JSON.parse(await readTextFile(manifest_path))
                    set_title(manifest?.info?.title)
                }catch(e:any){
                    console.error(e)
                }
            }
        })();
        
        return;
    },[])


    return (<>
        <div className={styles.container} style={{pointerEvents: allow_manage ? "all" : "none"}}>
            <div className={styles.box_1}>
                <ButtonBase className={styles.cover_box}
                    onClick={()=>{
                        navigate(`/preview/${source_id}/${preview_id}`)
                    }}
                >
                    <LazyLoadImage className={styles.cover}
                        alt={`${source_id}-${preview_id}`}
                        src={cover} 
                    
                    />
                </ButtonBase>
                <div className={styles.info_container}>
                    <div className={styles.info_box_1}>
                        
                        <span className={styles.title}>{type_schema === 2 ? `Season ${season_id} | ` : ""}{title??"?"}</span>
                        <>{(
                            task_info.source_id === source_id && 
                            task_info.preview_id === preview_id) &&
                            task_info.season_id === season_id &&
                            !pause_task
                            && <>
                                <span className={styles.title}>Episode {task_info?.watch_index+1}: {task_info.watch_title}</span>
                                <div className={styles.progress_box}>
                                    <>{(!progress_info.status || progress_info.status === "finished")
                                        ? <div style={{flex:1, color:"grey"}}>
                                                <LinearProgress variant="query" sx={{width:"100%"}} color="inherit"/>
                                            </div>
                                        : <>
                                            <div style={{flex:1}}>
                                                <LinearProgress variant="determinate" sx={{width:"100%"}} color="primary"
                                                    value={progress_info.percent}
                                                />
                                            </div>
                                            
                                            <span className={styles.progress_text}>{progress_info.label}</span>
                                        </>
                                    
                                    }</>
                                    
                                </div>
                            </>
                        }</>
                        
                        
                    </div>
                    <>{pause_task &&                        
                        <div className={styles.manage_box}>
                            <Tooltip title={"Remove all content from download task"}>
                                <ButtonBase
                                    
                                    sx={{
                                        gap:"2.5px",
                                        color:"red",
                                        borderRadius:"5px",
                                        padding:"5px",
                                        background:"var(--background-color)"
                                    }}
                                    onClick={async ()=>{
                                        set_allow_manage(false);
                                        for (const item_data of ITEM_DATA){
                                            await request_remove_download_task({
                                                source_id:source_id,
                                                preview_id:preview_id,
                                                season_id:season_id,
                                                watch_id:item_data.watch_id,
                                                clean:true
                                            })
                                        }
                                        await get_data();
                                        set_allow_manage(true);
                                    }}
                                >
                                    <DeleteForeverRoundedIcon sx={{fontSize:"calc((100vw + 100vh)*0.035/2)", color:"red",cursor:"pointer"}}/>
                                    
                                </ButtonBase>
                            </Tooltip>
                        </div>
                    }</>
                    <>{((ITEM_DATA.length > 0 && pause_task) || (ITEM_DATA.filter((item_data:any)=>!(
                        (task_info?.source_id === source_id) && 
                        (task_info?.preview_id === preview_id) && 
                        (task_info?.season_id === season_id) && 
                        (task_info?.watch_id === item_data.watch_id)
                    )).length > 0)) &&
                        <ButtonBase 
                            sx={{
                                background:"var(--background-color)",
                                color:"var(--color)",
                                boxShadow: "rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px",
                                borderBottomRightRadius: "5px"
                            }}
                            onClick={()=>{
                                set_show_content(!show_content);
                            }}
                        >
                            <>{show_content
                                ? <ExpandLessRoundedIcon sx={{
                                    fontSize:"calc((100vw + 100vh)*0.035/2)"
                                }}/>
                                : <ExpandMoreRoundedIcon sx={{
                                    fontSize:"calc((100vw + 100vh)*0.035/2)"
                                }}/>
                            }</>
                            
                        </ButtonBase>
                    }</>
                    
                </div>
            </div>
            <>{show_content && (ITEM_DATA.filter((item_data:any) => 
                (pause_task || !(
                    task_info?.source_id === source_id && 
                    task_info?.preview_id === preview_id && 
                    task_info?.season_id === season_id && 
                    task_info?.watch_id === item_data.watch_id
                ))
            ).length > 0) &&
                <div className={styles.box_2}>
                    <>{ITEM_DATA.filter((item_data:any) => 
                        (pause_task || !(
                            task_info?.source_id === source_id && 
                            task_info?.preview_id === preview_id && 
                            task_info?.season_id === season_id && 
                            task_info?.watch_id === item_data.watch_id
                        ))
                    ).map((item_data:any,index:number)=>(
                        <div className={styles.item_data_box} key={index}>
                            <>{item_data.error && 
                                <Tooltip title={"There is an error in downloading this item."}>
                                    <ErrorOutlineRoundedIcon sx={{fontSize:"calc((100vw + 100vh)*0.035/2)", color:"orange"}}/>
                                </Tooltip>
                            }</>

                            <span  className={styles.item_data_title}>Episode {item_data.watch_index+1}: {item_data.title}</span>
                            
                            <>{item_data.error && <>
                                <Tooltip title={"Retry"}
                                    onClick={async ()=>{
                                        set_allow_manage(false);
                                        const request_result = await request_set_error_task({
                                            source_id:source_id,
                                            preview_id:preview_id,
                                            season_id:season_id,
                                            watch_id:item_data.watch_id,
                                            error:false,
                                        })
                                        if (request_result.code === 200){
                                            const temp = ITEM_DATA;
                                            temp[index].error = false;
                                            SET_ITEM_DATA(temp);
                                            const cache_dir = await path.join(await path.appDataDir(), ".cache", "download", source_id, preview_id, season_id, item_data.watch_id);
                                            await remove(cache_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
                                        }

                                        set_allow_manage(true);
                                    }}
                                >
                                    <ReplayRoundedIcon sx={{fontSize:"calc((100vw + 100vh)*0.035/2)", color:"aqua",cursor:"pointer"}}/>
                                </Tooltip>
                            </>}</>
                            <Tooltip title={"Remove"}
                                onClick={async ()=>{
                                    set_allow_manage(false);
                                    const request_result = await request_remove_download_task({
                                        source_id:source_id,
                                        preview_id:preview_id,
                                        season_id:season_id,
                                        watch_id:item_data.watch_id,
                                        clean:true
                                    })

                                    if (request_result.code === 200) {
                                        const temp = ITEM_DATA;
                                        temp.splice(index, 1);
                                        if (temp.length === 0){
                                            await get_data();
                                        }
                                        SET_ITEM_DATA(temp);
                                    }
                                    
                                    set_allow_manage(true);
                                }}
                            >
                                <RemoveCircleOutlineRoundedIcon sx={{fontSize:"calc((100vw + 100vh)*0.035/2)", color:"red",cursor:"pointer"}}/>
                            </Tooltip>
                        </div>
                    ))}</>
                </div>
            }</>
        </div>
    </>)
}

export default RenderItem;