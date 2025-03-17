

// Tauri Plugins
import { Command } from '@tauri-apps/plugin-shell';
import { info, error } from '@tauri-apps/plugin-log';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

// React Imports
import { useDraggable } from "react-use-draggable-scroll";
import { useEffect, useState, useRef, useContext } from 'react';

// React Virtualized Imports
// import { List } from 'react-virtualized';

// MUI Imports
import { ButtonBase, Button, Tooltip } from '@mui/material';
import Fab from '@mui/material/Fab';

// MUI Icons
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';


// Framer motion Imports
import { AnimatePresence } from 'framer-motion';

// Components Import
import ManageTagWidget from '../../global/components/manage_tag_widget';

// Custom Imports
import styles from "../styles/main.module.css";
import global_context from '../../global/script/contexts';
import { request_tag_data } from '../../global/script/request_manage_tag';


function Watchlist() {
    const {app_ready, set_app_ready} = useContext<any>(global_context);

    const tag_container_ref:any = useRef();
    const { events } = useDraggable(tag_container_ref); 


    const [tag_data, set_tag_data] = useState<any>([]);
    const [selected_tag, set_selected_tag] = useState<string>("");
    const [widget, set_widget] = useState<string>("");


    const isRun = useRef<boolean>(false);
    useEffect(()=>{
        if (!app_ready || isRun.current) return;
        isRun.current = true;
        (async () => {
            const result = await request_tag_data();
            if (result.code === 200){
                set_tag_data(result.data);
                if (result.data.length) set_selected_tag(result.data[0]);
            }
            
            
            isRun.current = false;
        })();
        return;
    },[app_ready])

    return (<>
        <div className={styles.container}>
            <div className={styles.header}>
                <ButtonBase
                    sx={{
                        color:"var(--icon-color-1)",
                        backgroundColor:"var(--background-color-layer-1)",
                    }}
                    onClick={()=>{
                        tag_container_ref.current.scrollBy({
                            top: 0,
                            left:  - tag_container_ref.current.clientWidth * 0.25, 
                            behavior: 'smooth', 
                        });
                    }}
                >
                    <ArrowBackIosRoundedIcon/>
                </ButtonBase>
                <div className={styles.tag_container} {...events} ref={tag_container_ref}>
                    <div className={styles.tag_box}>
                        <>{tag_data.map((item:any, index:number)=>(
                            <ButtonBase key={index}
                                sx={{
                                    padding: "12px", 
                                    backgroundColor: item === selected_tag ? "var(--selected-tag-color)" : "var(--background-color-layer-1)", 
                                    color:"var(--color)",
                                    boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                                }}
                                onClick={()=>{set_selected_tag(item)}}
                            >{item}</ButtonBase>

                        ))}</>
                        
                        

                        
                    </div>
                </div>
                <ButtonBase
                    sx={{
                        color:"var(--icon-color-1)",
                        backgroundColor:"var(--background-color-layer-1)",
                    }}
                    onClick={()=>{
                        tag_container_ref.current.scrollBy({
                            top: 0,
                            left: tag_container_ref.current.clientWidth * 0.25, 
                            behavior: 'smooth', 
                        });
                    }}
                >
                    <ArrowForwardIosRoundedIcon/>
                </ButtonBase>
            </div>
            <div className={styles.action_button_container}>
                <Tooltip title="Create tag" placement='left'>
                    <Fab color='primary' size='small' style={{zIndex:1}}
                        onClick={()=>{set_widget("manage_tag")}}
                    >
                        <AddRoundedIcon />
                    </Fab>
                </Tooltip>
            </div>
            <AnimatePresence>
                {widget === "manage_tag" && <ManageTagWidget 
                    {...{onClose:()=>{set_widget("")},
                        callback:({tag_data}:any)=>{
                            set_tag_data(tag_data);
                            if (tag_data.length) set_selected_tag(tag_data[0]);
                        }
                        
                    }}
                />}
            </AnimatePresence>
            
        </div>
    </>);
}

export default Watchlist;
