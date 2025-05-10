// React Import
import { useEffect, useState, useRef, useCallback, useContext, Fragment } from "react";
import { useNavigate } from "react-router";

// Tauri Import
import { writeTextFile, readTextFile, exists, mkdir, BaseDirectory, remove } from "@tauri-apps/plugin-fs"
import { path } from "@tauri-apps/api"
import { convertFileSrc } from '@tauri-apps/api/core';

// MUI Imports
import { ButtonBase, IconButton } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';

// Lazy Load Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Context Import
import { download_task_context, global_context } from "../../global/scripts/contexts";

// Custom Import
import { get_installed_sources } from "../../global/scripts/manage_extension_sources";
import write_crash_log from "../../global/scripts/write_crash_log";
import { request_download_task } from "../../global/scripts/manage_download";

// styles Import
import styles from "../styles/render_item.module.css";

const RenderItem = ({item}:any) => {
    const source_id = item.source_id;
    const season_id = item.season_id;
    const preview_id = item.preview_id;

    const navigate = useNavigate();
    
    const {download_task_info, download_task_progress} = useContext<any>(download_task_context)


    const [cover, set_cover] = useState<string>("")
    const [title, set_title] = useState<string>("")

    const [show_content, set_show_content] = useState<boolean>(false)

    useEffect(()=>{
        ;(async ()=>{
            console.log("ii",item)
            console.log("cc",download_task_info)
            const DATA_DIR = await path.join(await path.appDataDir(), "data")
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
                    console.log(e)
                }
            }
        })();
        
        return;
    },[])


    return (<>
        <div className={styles.container}>
            <div className={styles.box_1}>
                <ButtonBase className={styles.cover_box}>
                    <LazyLoadImage className={styles.cover}
                        alt={`${source_id}-${preview_id}`}
                        src={cover} 
                    
                    />
                </ButtonBase>
                <div className={styles.info_container}>
                    <div className={styles.info_box_1}>
                        <span className={styles.title}>{title??"?"}</span>
                        <>{(
                            download_task_info.source_id === source_id && 
                            download_task_info.season_id === season_id &&
                            download_task_info.preview_id === preview_id) 
                            && <>
                                <span className={styles.title}>Episode {download_task_info?.watch_index}: {download_task_info.watch_title}</span>
                                <LinearProgress variant="determinate" 
                                    value={20}
                                />
                            </>
                        }</>
                        
                    </div>
                    
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
                </div>
            </div>
            <>{show_content &&
                <div className={styles.box_2}>
                    <>{item.data.map((item_data:any,index:number)=>(
                        <Fragment key={index}>
                            {!(
                                download_task_info?.source_id === source_id && 
                                download_task_info?.season_id === season_id && 
                                download_task_info?.preview_id === preview_id && 
                                download_task_info?.watch_id == item_data.watch_id
                            ) &&
                                <span  className={styles.item_data_title}>Episode {item_data.watch_index}: {item_data.title}</span>
                            }
                            
                        </Fragment>
                        
                    ))}</>
                </div>
            }</>
        </div>
    </>)
}

export default RenderItem;