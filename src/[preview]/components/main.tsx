// React Imports
import { useEffect, useRef, useState, Fragment, useMemo, useCallback, useContext } from "react";
import { useNavigate, useParams } from "react-router";

// MUI Imports
import { ButtonBase, IconButton, Button, Tooltip } from "@mui/material";
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';

// Dayjs Imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

// MUI Icons
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PublishedWithChangesRoundedIcon from '@mui/icons-material/PublishedWithChangesRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

// Images Imports
import Blocks_Loading from "../../assets/images/blocks_loading.svg";

// Disqus Imports
import { DiscussionEmbed } from 'disqus-react';

// Context Imports
import global_context from "../../global/scripts/contexts";

// Styles Imports
import styles from '../styles/main.module.css';
import randomColor from "randomcolor";

// Custom Imports
import check_internet_connection from "../../global/scripts/check_internet_connection";
import get_preview from "../scripts/get_preview";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { request_remove_from_tag, request_tag_data, request_add_to_tag, request_item_tags } from "../../global/scripts/manage_tag";
import { get_local_preview, save_local_preview, remove_local_preview} from "../../global/scripts/manage_local_preview";

const FETCH_UPDATE_INTERVAL = 10; // In Minutes

const Preview = () => {
    const navigate = useNavigate();

    const { app_ready } = useContext<any>(global_context);

    const [is_ready, set_is_ready] = useState<boolean>(false);
    const [is_update, set_is_update] = useState<any>({state:false,error:false,message:""})
    const [is_online, set_is_online] = useState<boolean>(false);
    const { source_id, preview_id }:any = useParams();
    const [TAG_DATA, SET_TAG_DATA] = useState<any>([])
    const [INFO, SET_INFO] = useState<any>({});
    const [STATS, SET_STATS] = useState<any>({});
    const [EPISODE_DATA, SET_EPISODE_DATA] = useState<any>([]);
    

    const [selected_tag, set_selected_tag] = useState<any>([]);
    const [show_more_info, set_show_more_info] = useState<boolean>(false)
    const [current_page, set_current_page] = useState<number>(1);
    const [is_error, set_is_error] = useState<any>({state:false,message:"Unable to request source"});

    const last_selected_tag = useRef<any>([]);

    // Manage Tag Event
    useEffect(()=>{
        
        (async () => {
            if (!is_ready) return;
            const removed_tag = last_selected_tag.current.filter((item:string) => !selected_tag.includes(item));
            for (const tag of removed_tag) {
                await request_remove_from_tag({tag_name:tag,source_id,preview_id})
            }
            const added_tag = selected_tag.filter((item:string) => !last_selected_tag.current.includes(item));
            for (const tag of added_tag) {
                await request_add_to_tag({tag_name:tag,source_id,preview_id})
            }
            if (selected_tag.length && added_tag.length){
                await save_local_preview({
                    source_id,preview_id,
                    data:{
                        info:INFO,
                        stats:STATS,
                        episodes:EPISODE_DATA,
                        last_update: dayjs.utc().unix(),
                    },
                });
            }else if (!selected_tag.length){
                await remove_local_preview({source_id,preview_id})
            }
            last_selected_tag.current = selected_tag
        })();
        
    },[selected_tag, is_ready])
    // ===============

    const load_tag_data = useCallback(async () => {
        const request_tag_data_result = await request_tag_data()
        if (request_tag_data_result.code === 200){
            SET_TAG_DATA(request_tag_data_result.data)
        }else {
            set_is_error({state:true,message:"Failed to tag data."});
            return {code:500,message:"Failed to tag data."};
        }

        const request_item_tags_result:any = await request_item_tags({source_id,preview_id});
        if (request_item_tags_result.code === 200){
            last_selected_tag.current = request_item_tags_result.data;
            set_selected_tag(request_item_tags_result.data);
        }else{
            set_is_error({state:true,message:"Failed to request item tags."});
            return {code:500,message:"Failed to request item tags."};
        }
        return {code:200,message:"OK"}
    },[])

    const get_data = useCallback(async ({mode}:{mode:string}) => {
        set_is_ready(false);
        set_is_error({state:false,message:""});
        if (mode === "update") set_is_update({...is_update, state:true,error:false})
        else set_is_update({ state:false,error:false, message:""});
        
        const load_tag_result = await load_tag_data();
        if (load_tag_result.code !== 200) return;

        if (mode === "update") set_is_ready(true)

        const request_preview_result = await get_preview({source_id,preview_id});
        if (request_preview_result.code === 200) {
            SET_INFO(request_preview_result.result.info);
            SET_STATS(request_preview_result.result.stats);
            SET_EPISODE_DATA(request_preview_result.result.episodes);
            if (mode === "update") {
                await save_local_preview({
                    source_id,preview_id,
                    data:{
                        info:request_preview_result.result.info,
                        stats:request_preview_result.result.stats,
                        episodes:request_preview_result.result.episodes,
                        last_update: dayjs.utc().unix(),
                    }
                });
            }
            
        }else if (mode === "get") {
            set_is_error({state:true,message:"Failed to request source."});
            return;
        }else if (mode === "update"){
            set_is_update({state:false,error:true, message:"Failed to request source." })
        }

        set_is_update({state:false,error:false, message:""})
        set_is_ready(true);
    },[])

    const is_run = useRef<boolean>(false);
    useEffect(()=>{
        if (is_run.current || !app_ready) return;
        is_run.current = true;
        set_is_ready(false);
        (async () => {
            const is_online_result = await check_internet_connection();
            set_is_online(is_online_result);
            const local_preview_result = await get_local_preview({source_id,preview_id})
            if (local_preview_result.code === 200){
                const data = local_preview_result.result
                SET_INFO(data.info)
                SET_STATS(data.stats)
                SET_EPISODE_DATA(data.episodes)
                try{
                    if (dayjs.utc().unix() - (data.last_update??0) <= FETCH_UPDATE_INTERVAL * 60) {
                        await load_tag_data();
                        set_is_update({ state:false,error:false, message:"" });
                        set_is_ready(true);
                    }else{
                        await get_data({mode:"update"});
                    }
                    
                }catch{(e:any)=>{
                    console.error(e);
                    set_is_update({ state:true,error:true, message:"Failed to request source update." });
                    set_is_ready(true);
                }}
                
            }else{
                await get_data({mode:"get"});
            }
        })();
        
    },[app_ready])

    const TAG_BOX_COMPONENT = useCallback(({item_key}:any)=>{
        const bg_color = useMemo(()=>randomColor({luminosity:"bright",format: 'rgba',alpha:0.8}),[STATS])
        return (
            <div className={styles.stats_box} 
                style={{
                    background: bg_color,
                }}
            >
                <span className={styles.stats_text}>
                    <>{["sub","dub","eps"].includes(item_key)
                        ? <>
                            {item_key === "sub" && `SUB: ${STATS[item_key] }`}
                            {item_key === "dub" && `DUB: ${STATS[item_key] }`}
                            {item_key === "eps" && `EPS: ${STATS[item_key] }`}
                        </>
                        : <>{STATS[item_key]}</>
                    }</>
                </span>
            </div>
        )
    },[STATS])


    return (
        <div className={styles.container}>
            <>{is_error.state 
                ? <div
                    style={{
                        width:"100%",
                        height:"100%",
                        display:"flex",
                        flexDirection:"column",
                        justifyContent:"center",
                        alignItems:"center",
                        gap:"12px",
                    }}
                >
                    <span
                        style={{
                            fontFamily:"var(--font-family-medium)",
                            color:"red",
                            fontSize:"calc((100vw + 100vh) * 0.0225 / 2)",
                        }}
                    >{is_error.message}</span>
                    <Button variant="contained"
                        onClick={async ()=>{
                            await get_data({mode:"get"});
                        }}
                    >Retry</Button>
                    <Button variant="text"
                        onClick={()=>{
                            if (window.history.state && window.history.state.idx > 0) {
                                navigate(-1);
                            } else {
                                console.error("No history to go back to");
                            }
                        }}
                    >Go back</Button>
                </div>
                : <>{is_ready
                    ? <>
                        <div className={styles.header}>
                            <IconButton color="primary" size="large"
                                onClick={()=>{
                                    if (window.history.state && window.history.state.idx > 0) {
                                        navigate(-1);
                                    } else {
                                        console.error("No history to go back to");
                                    }
                                }}
                            >
                                <ArrowBackRoundedIcon sx={{color:"var(--icon-color-1)"}} fontSize="large"/>
                            </IconButton>
                            <div
                                style={{
                                    display:"flex",
                                    flexDirection:"row",
                                    gap: "8px",
                                    alignItems:"center",
                                    
                                }}
                            >
                                <>{is_update.error
                                    ? <>
                                        <Tooltip title={is_update.message}>
                                            <IconButton color="error" size="large"
                                                onClick={async ()=>{
                                                    await get_data({mode:"update"});
                                                }}
                                            >
                                                <ErrorOutlineRoundedIcon color="error" fontSize="medium"/>
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                    : <>{is_update.state
                                        ? <Tooltip title="Fetching update...">
                                            <CircularProgress color="secondary" size="calc((100vw + 100vh)*0.05/2)"/>
                                        </Tooltip>
                                        : <Tooltip title={`Fetch update: Auto every ${FETCH_UPDATE_INTERVAL} minutes`}>
                                            <IconButton color="primary" size="large"
                                                onClick={async ()=>{
                                                    await get_data({mode:"update"});
                                                }}
                                            >
                                                <PublishedWithChangesRoundedIcon color="success" fontSize="large"/>
                                            </IconButton>
                                            
                                        </Tooltip>
    
                                    }</>                         
                                }</>
                                
                                
                                
                                <IconButton color="primary" size="large">
                                    <DownloadRoundedIcon sx={{color:"var(--icon-color-1)"}} fontSize="large"/>
                                </IconButton>
                            </div>
                        </div>
                        <div className={styles.body}>
                            <div className={styles.body_box_1}>
                                <div
                                    style={{
                                        width:"auto",
                                        height:"auto",
                                        display:"flex",
                                        flexDirection:"column",
                                        gap:"12px",
                                        boxSizing:"border-box",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "calc((100vw + 100vh) * 0.2 / 2)",
                                            height: "calc((100vw + 100vh) * 0.275 / 2)",
                                            background:"var(--background-color-layer-1)",
                                            borderRadius:"8px",
                                            boxShadow:  "rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px",
                                            boxSizing:"border-box",
                                        }}
                                    >
                                        <LazyLoadImage
                                            style={{width:"100%",height:"100%",borderRadius:"inherit"}}
                                            src={INFO.local_cover || INFO.cover}
                                        />
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
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontFamily:"var(--font-family-medium)",
                                                        color:"var(--color)",
                                                        fontSize:"calc((100vw + 100vh) * 0.0225 / 2)",
                                                    }}
                                                >00:25:00</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <FormControl sx={{ maxWidth: "calc((100vw + 100vh) * 0.2 / 2)"}}>
                                        <InputLabel sx={{color:"var(--color)"}}>Watchlist</InputLabel>
                                        <Select
                                            sx={{color:"var(--color)", background:"var(--background-color-layer-1)"}}
                                            labelId="demo-multiple-checkbox-label"
                                            id="demo-multiple-checkbox"
                                            multiple
                                            value={selected_tag}
                                            onChange={(event:any)=>{
                                                const {target: { value }} = event;
                                                const result = typeof value === 'string' ? value.split(',') : value
                                                set_selected_tag(result);
                                            }}
                                            input={<OutlinedInput label="Watchlist"/>}
                                            renderValue={(selected) => selected.join(', ')}
                                            MenuProps={{
                                                PaperProps: {
                                                    style: {
                                                        maxHeight: "calc((100vw + 100vh) * 0.4 / 2)",
                                                        width: "calc((100vw + 100vh) * 0.3 / 2)",
                                                        background:"var(--background-color-layer-1)",
                                                        color:"var(--color)",
                                                    },
                                                },
                                            }}
                                        >
                                            {TAG_DATA.map((tag:string,index:number) => (
                                                <MenuItem key={index} value={tag}>
                                                    <Checkbox checked={selected_tag.includes(tag)} sx={{color:"var(--color)"}}/>
                                                    <ListItemText primary={tag} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                </div>
                                <div
                                    style={{
                                        display:"flex",
                                        flex:1,
                                        background:"var(--background-color)",
                                        flexDirection:"column",
                                        boxSizing: "border-box",
                                        gap:"12px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily:"var(--font-family-bold)",
                                            color:"var(--color)",
                                            fontSize:"calc((100vw + 100vh) * 0.0325 / 2)",
                                            wordBreak:"break-word",
                                        }}
                                    >{INFO.title}</span>

                                    {/* Stats container */}
                                    <div className={styles.stats_container}>
                                        <div className={styles.stats_box} 
                                            style={{
                                                background: randomColor({luminosity:"bright",format: 'rgba',alpha:0.8})
                                            }}
                                        >
                                            <span className={styles.stats_text}>
                                                SOURCE: {source_id}
                                            </span>
                                        </div>
                                        
                                        <>{Object.keys(STATS).map((item_key,index)=>(
                                            <TAG_BOX_COMPONENT item_key={item_key} key={index}/>
                                        ))}</>
                                    </div>
                                    {/* ============= */}

                                    <div
                                        style={{
                                            display:"flex",
                                            width:"100%",
                                            alignItems:"center",
                                            justifyContent:"flex-start",
                                            paddingTop:"calc((100vw + 100vh) * 0.025/2)"
                                        }}
                                    >
                                        <ButtonBase
                                            sx={{
                                                background:"var(--background-color-layer-1)",
                                                color:"var(--color)",
                                                display:"flex",
                                                flexDirection:"column",
                                                justifyContent:"center",
                                                width:"calc((100vw + 100vh) * 0.35/2)",
                                                borderRadius:"18px",
                                                padding:"4px",
                                                boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                                                fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                            }}
                                        >
                                            <span style={{fontFamily: "var(--font-family-bold)"}}>Continues</span>
                                            <span style={{fontFamily: "var(--font-family-light)"}}>Episode: 1</span>
                                        </ButtonBase>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.body_box_2}
                                style={{
                                    height: show_more_info ? "auto" : "calc((100vw + 100vh) * 0.25 / 2)",
                                    overflow: "hidden"
                                }}
                            >
                                <div
                                    style={{
                                        display:"flex",
                                        flexDirection:"row",
                                        justifyContent:"space-between",
                                        
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-family-bold)",
                                            color: "var(--color)",
                                            fontSize: "calc((100vw + 100vh) * 0.025 / 2)",
                                        }}
                                    >Description:</span>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{
                                            borderRadius:"12px",
                                            color:"var(--color)",
                                            fontFamily: "var(--font-family-medium)",
                                            fontSize: "calc((100vw + 100vh) * 0.0125 / 2)",
                                        }}
                                        onClick={()=>{set_show_more_info(!show_more_info)}}
                                    >
                                        {show_more_info ? "show less" : "show more"}
                                    </Button>
                                </div>
                                <div
                                    style={{
                                        borderBottom: "2px solid var(--background-color-layer-1)",
                                        paddingBottom: "12px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "var(--font-family-regular)",
                                            color: "var(--color)",
                                            fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                            wordBreak:"break-word",
                                        }}
                                    >{INFO.description}</span>
                                </div>
                                <div
                                    style={{
                                        display:"flex",
                                        flexDirection:"column",
                                        gap:"8px",
                                    }}
                                >
                                    <>{Object.keys(INFO).map((item_key:string,index:number)=>(<Fragment key={index}>
                                        <>{!["cover","local_cover","description", "title"].includes(item_key) && (
                                            <span
                                                style={{
                                                    fontFamily: "var(--font-family-regular)",
                                                    color: "var(--color)",
                                                    fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                                    wordBreak:"break-word",
                                                }}
                                            ><span style={{fontFamily: "var(--font-family-bold)"}}>{item_key[0].toUpperCase() + item_key.slice(1)}</span> {INFO[item_key]}</span>
                                        )}</>
                                    </Fragment>))
                                    }</>
                                </div>

                            </div>
                            <div className={styles.body_box_3}>
                                <>{EPISODE_DATA?.length 
                                    ? <>{EPISODE_DATA[current_page-1].map((item:any,index:number)=>(<Fragment key={index}>
                                        <ButtonBase
                                            style={{
                                                borderRadius:"12px",
                                                background:"var(--background-color)",
                                                color:"var(--color)",
                                                display:"flex",
                                                alignItems:"center",
                                                justifyContent:"flex-start",
                                                padding:"12px",
                                                border:"2px solid var(--background-color-layer-1)",
                                                fontFamily: "var(--font-family-medium)",
                                                fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                            }}
                                        >
                                            <span><span style={{fontFamily: "var(--font-family-bold)"}}>Episode {item.index}: </span>{item.title}</span>
                                        </ButtonBase>
                                    </Fragment>))}</>
                                    : <></>
                                }</>
                            </div>
                            <div className={styles.body_box_4}>
                                <Pagination count={EPISODE_DATA.length} page={current_page} color="primary" showFirstButton showLastButton
                                    sx={{
                                        ul: {
                                            "& .MuiPaginationItem-root": {
                                                color:"var(--color)",
                                            }
                                        }
                                    }}
                                    onChange={(_, page:number)=>{set_current_page(page)}}
                                />
                                
                            </div>
                            <div className={styles.body_box_5}>
                                <>{is_online &&
                                    <DiscussionEmbed
                                        shortname='hyperionbox'
                                        config={
                                            {
                                                identifier: `${source_id}-${preview_id}`,
                                                title: INFO.title,
                                                language: 'en' //e.g. for Traditional Chinese (Taiwan)
                                            }
                                        }
                                    />
                                }</>
                            </div>
                        </div>
                    </>
                    : <div
                        style={{
                            width:"100%",
                            height:"100%",
                            display:"flex",
                            alignItems:"center",
                            justifyContent:"center",
                        }}
                    >
                        <object type="image/svg+xml" data={Blocks_Loading}
                            style={{
                                width:"calc((100vw + 100vh) * 0.25 / 2)",
                                height:"auto",
                            }}
                        />
                    </div>
                    
                }</>
            }</>
        </div>
        
    );
}

export default Preview;