

// Tauri Plugins


// React Imports
import { useDraggable } from "react-use-draggable-scroll";
import { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { useNavigate } from "react-router";

// Lazy Images Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// MUI Imports
import { ButtonBase, Tooltip } from '@mui/material';
import Fab from '@mui/material/Fab';

// MUI Icons
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

// Framer motion Imports
import { AnimatePresence } from 'framer-motion';

// Components Import
import ManageTagWidget from '../../global/components/manage_tag_widget';

// Custom Imports
import styles from "../styles/main.module.css";
import global_context from '../../global/scripts/contexts';
import { request_tag_data } from '../../global/scripts/manage_tag';
import request_content_from_tag from '../scripts/request_content_from_tag';


function Watchlist() {
    const navigate = useNavigate();
    const {app_ready, set_app_ready} = useContext<any>(global_context);

    const tag_container_ref:any = useRef({});
    const { events } = useDraggable(tag_container_ref); 


    const [tag_data, set_tag_data] = useState<any>([]);
    const [selected_tag, set_selected_tag] = useState<string>("");
    const [DATA, SET_DATA] = useState<any>([]);
    const [current_page, set_current_page] = useState<number>(1);
    const [widget, set_widget] = useState<string>("");


    // Check selected tag changes then set tag content
    useEffect(()=>{
        if (!app_ready || !selected_tag) return;
        (async ()=>{
            set_current_page(1);
            const result = await request_content_from_tag({tag_name:selected_tag,page:1});
            console.log(result)
            if (result.code === 200){
                SET_DATA(result.data);
            }
            set_app_ready(true);
        })();
    },[selected_tag])
    // =========================

    // Check if app is ready to use then load the page content
    const isRun = useRef<boolean>(false);
    useEffect(()=>{
        if (!app_ready || isRun.current) return;
        isRun.current = true;
        (async () => {
            const result = await request_tag_data();
            if (result.code === 200){
                set_tag_data(result.data);
                if (result.data.length) set_selected_tag(result.data[0]);
            }else return;
            
            
            isRun.current = false;
        })();
        return;
    },[app_ready])
    // =========================

    const RenderItem:any = useCallback(({item}:{item:any}) => {
        
        return (<div>
            <ButtonBase className={styles.cover_box}          
                onClick={()=>{
                    navigate(`/preview/${item.source_id}/${item.preview_id}`);
                }}
            >
                <LazyLoadImage className={styles.cover}
                    src={item.cover}
                />
                <span className={styles.cover_title}>
                    {item.title}
                </span>
            </ButtonBase>
        </div>)
    },[])

    return (<>
        <div className={styles.container}>
            <div className={styles.header}>
                <Tooltip title="Scroll left">
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
                </Tooltip>
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
                <Tooltip title="Scroll right">
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
                </Tooltip>
            </div>
            <div className={styles.body}>
                <div className={styles.body_box_1}>

                    <>{DATA.map((item:any,index:number)=>(
                        <RenderItem key={index} item={item}/>
                    ))}</>
                    
                </div>
            </div>
            <div className={styles.action_button_container}>
                <Tooltip title="Manage tag" placement='left'>
                    <Fab color='primary' size='small' style={{zIndex:1}}
                        onClick={()=>{set_widget("manage_tag")}}
                    >
                        <EditRoundedIcon />
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
