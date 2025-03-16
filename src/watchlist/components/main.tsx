

// Tauri Plugins
import { Command } from '@tauri-apps/plugin-shell';
import { info, error } from '@tauri-apps/plugin-log';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

// React Imports
import { useDraggable } from "react-use-draggable-scroll";
import { useEffect, useState, useRef, useContext } from 'react';

// React Virtualized Imports
import { List } from 'react-virtualized';

// MUI Imports
import { ButtonBase, Button, Tooltip } from '@mui/material';
import Fab from '@mui/material/Fab';

// MUI Icons
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';

// Custom imports
import styles from "../styles/main.module.css";
import global_context from '../../global/script/contexts';
import load_tags from '../scripts/load_tags';


function Watchlist() {
    const {app_ready, set_app_ready} = useContext<any>(global_context);

    const tag_container_ref:any = useRef();

    const { events } = useDraggable(tag_container_ref); 


    const [tag_data, set_tag_data] = useState<any>([]);
    const [selected_tag, set_selected_tag] = useState<string>("");

    

    const isRun = useRef<boolean>(false);
    useEffect(()=>{
        if (!app_ready || isRun.current) return;
        isRun.current = true;
        (async () => {
            // await load_tags({set_tags});
            set_tag_data(["anime","movie"]);
            set_selected_tag("anime");
            isRun.current = false;
        })();
        return;
    },[app_ready])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <ButtonBase
                    sx={{
                        color:"var(--icon-color-1)",
                        backgroundColor:"var(--background-color-layer-1)",
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
                >
                    <ArrowForwardIosRoundedIcon/>
                </ButtonBase>
            </div>
            <div className={styles.action_button_container}>
                <Tooltip title="Create tag" placement='left'>
                    <Fab color='primary' size='small'
                    >
                        <AddRoundedIcon />
                    </Fab>
                </Tooltip>
            </div>
        </div>
    );
}

export default Watchlist;
