

// Tauri Plugins


// React Imports
import { useDraggable } from "react-use-draggable-scroll";
import { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { useNavigate } from "react-router";

// Lazy Images Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// MUI Imports
import { ButtonBase, Tooltip, Button, IconButton } from '@mui/material';
import Fab from '@mui/material/Fab';

// MUI Icons
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Pagination from '@mui/material/Pagination';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

// Dayjs Imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

// Framer motion Imports
import { AnimatePresence } from 'framer-motion';

// Components Import
import ManageTagWidget from '../../global/components/manage_tag_widget';

// Custom Imports
import styles from "../styles/main.module.css";
import global_context from '../../global/scripts/contexts';
import { request_tag_data, request_content_from_tag } from '../../global/scripts/manage_tag';


function Watchlist() {
    const navigate = useNavigate();
    const {app_ready} = useContext<any>(global_context);
    const { set_menu } = useContext<any>(global_context);

    const tag_container_ref:any = useRef({});
    const { events } = useDraggable(tag_container_ref); 

    const [search, set_search] = useState<string>("");
    const [search_mode, set_search_mode] = useState<Boolean>(false)
    const [tag_data, set_tag_data] = useState<any>([]);
    const [selected_tag, set_selected_tag] = useState<string>("");
    const [DATA, SET_DATA] = useState<any>([]);
    const [max_page, set_max_page] = useState<number>(0);
    const [current_page, set_current_page] = useState<number>(1);
    const [widget, set_widget] = useState<string>("");

    const get_data = async ({tag_name,page=1,search=""}:{tag_name:string,page:number,search:string})=>{
        const result:any = await request_content_from_tag({tag_name,page,search});
        if (result.code === 200){
            SET_DATA(result.data);
            console.log("AGA", result.data)
            set_max_page(result.max_page);
        }
    }

    // Check selected tag changes then set tag content
    useEffect(()=>{
        (async ()=>{
            if (!selected_tag) return;
            set_current_page(1);
            await get_data({tag_name:selected_tag,page:1,search});
        })();
    },[selected_tag])
    // =========================

    // Check if app is ready to use then load the page content
    useEffect(()=>{
        if (!app_ready) return;
        (async () => {
            const tag_data_result = await request_tag_data();
            if (tag_data_result.code === 200){
                set_tag_data(tag_data_result.data);
                if (tag_data_result.data.length) set_selected_tag(tag_data_result.data[0]);
            }else return;
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
                <div className={styles.cover}>                
                    <LazyLoadImage 
                        style={{
                            width:"100%",
                            height:"100%",
                            objectFit:"cover",
                            borderRadius:"inherit",
                        }}
                        src={item.cover}
                    />
                    <>{item.current_time &&
                        <div className={styles.cover_overlay}>
                            <div
                                style={{
                                    width:"auto",
                                    height:"auto",
                                    background:"var(--icon-color-2)",
                                    padding: "4px",
                                    borderRadius:"6px",
                                    display:"flex",
                                    alignItems:'center',
                                    boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px"
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily:"var(--font-family-medium)",
                                        color:"var(--color)",
                                        fontSize:"calc((100vw + 100vh) * 0.0165 / 2)",
                                    }}
                                >{dayjs.duration(item.current_time, "seconds").format("HH:mm:ss")}</span>
                            </div>
                        </div>
                    }</>
                </div>
                <span className={styles.cover_title}>
                    {item.title??"?"}
                </span>
                
            </ButtonBase>
        </div>)
    },[])

    return (<>
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.navigate_box}>
                    <>{tag_data.length 
                        ? <Tooltip title="Scroll left">
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
                        : <></>
                    }</>
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
                                    onClick={()=>{
                                        set_selected_tag(item);
                                        
                                    }}
                                >{item}</ButtonBase>

                            ))}</>
                            
                            

                            
                        </div>
                    </div>
                    <>{tag_data.length 
                        ? <Tooltip title="Scroll right">
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
                        : <></>
                    }</>
                </div>

                <div className={styles.filter_box}>
                    <form className={styles.search_container} onSubmit={(e)=>{e.preventDefault()}}>
                        <div className={styles.search_box}>
                            <input type='text' placeholder='Search' value={search}
                                onChange={(e)=>{set_search(e.target.value)}}
                            ></input>
                        </div>
                        <IconButton color="primary" size='large' type="submit" 
                            onClick={async ()=>{
                                if (!search)set_search_mode(false);
                                else set_search_mode(true);
                                await get_data({tag_name:selected_tag,page:1,search})
                                set_current_page(1)
                            }}
                        >
                            <SearchRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                        </IconButton>
                    </form>
                </div>
            </div>
            <>{tag_data.length

                ? <>
                    {DATA.length
                        ? <div className={styles.body}>
                            
                            <div className={styles.body_box_1}>
                                <>{DATA.map((item:any,index:number)=>(
                                    <RenderItem key={index} item={item}/>
                                ))}</>
                                
                            </div>
                            <div className={styles.body_box_2}>
                                <Pagination count={max_page} page={current_page} color="primary" showFirstButton showLastButton
                                    sx={{
                                        ul: {
                                            "& .MuiPaginationItem-root": {
                                                color:"var(--color)",
                                            }
                                        }
                                    }}
                                    onChange={async (_, page:number)=>{
                                        set_current_page(page);
                                        await get_data({tag_name:selected_tag,page:page,search});
                                    }}
                                />
                                
                            </div>
                        </div>
                        : <div
                            style={{
                                width:"100%",
                                height:"100%",
                                display:"flex",
                                justifyContent:"center",
                                alignItems:"center",
                                flexDirection:"column",
                                gap:"18px"
                            }}
                        >
                            <span 
                                style={{
                                    color:"var(--color)",
                                    fontFamily:"var(--font-family-bold)",
                                    fontSize: "calc((100vw + 100vh)*0.0325/2)",
                                }}
                            >{search_mode ? "Search no result." : "No content inside this tag."}</span>
                            <Button color="primary" variant="contained"
                                sx={{
                                    color:"var(--color)",
                                    fontFamily:"var(--font-family-bold)",
                                    fontSize: "calc((100vw + 100vh)*0.0225/2)",
                                }}
                                onClick={()=>{
                                    set_menu({state:true,path:"explore"});
                                }}
                            >
                                Let Explore
                            </Button>
                        </div>
                    
                    
                    }
                </>
                
                : <div
                    style={{
                        width:"100%",
                        height:"100%",
                        display:"flex",
                        justifyContent:"center",
                        alignItems:"center",
                        flexDirection:"column",
                        gap:"18px"
                    }}
                >
                    <span 
                        style={{
                            color:"var(--color)",
                            fontFamily:"var(--font-family-bold)",
                            fontSize: "calc((100vw + 100vh)*0.0325/2)",
                            textAlign:"center",
                        }}
                    >No tag available. <br/>Press <EditRoundedIcon fontSize="medium"/> icon or</span>
                    <Button color="primary" variant="contained"
                        sx={{
                            color:"var(--color)",
                            fontFamily:"var(--font-family-bold)",
                            fontSize: "calc((100vw + 100vh)*0.0225/2)",
                        }}
                        onClick={()=>{
                            set_widget("manage_tag");
                        }}
                    >
                        Let Create now
                    </Button>
            </div>
            }</>
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
