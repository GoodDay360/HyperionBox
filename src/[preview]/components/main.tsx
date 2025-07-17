// Tauri Imports
import { path } from '@tauri-apps/api';
import { BaseDirectory, exists, remove, readTextFile } from "@tauri-apps/plugin-fs";

// React Imports
import { useEffect, useRef, useState, Fragment, useMemo, useCallback, useContext } from "react";
import { useNavigate, useParams } from "react-router";


// MUI Component Imports
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
import SelectAllRoundedIcon from '@mui/icons-material/SelectAllRounded';
import Fab from '@mui/material/Fab';



// MUI Icons
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PublishedWithChangesRoundedIcon from '@mui/icons-material/PublishedWithChangesRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeselectRoundedIcon from '@mui/icons-material/DeselectRounded';
import DownloadForOfflineRoundedIcon from '@mui/icons-material/DownloadForOfflineRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';

// Dayjs Imports
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);


// Framer Motion
import { AnimatePresence } from 'framer-motion';

// Media Imports
import Blocks_Loading from "../../assets/images/blocks_loading.svg";

// Disqus Imports
import { DiscussionEmbed } from 'disqus-react';

// Context Imports
import { global_context } from "../../global/scripts/contexts";

// Styles Imports
import styles from '../styles/main.module.css';
import randomColor from "randomcolor";

// Custom Components
import ManageDownloadWidget from "./manage_download_widget";
import RemoveDownloadWidget from './remove_download_widget';

// Custom Imports
import check_internet_connection from "../../global/scripts/check_internet_connection";
import get_preview from "../scripts/get_preview";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { request_remove_from_tag, request_tag_data, request_add_to_tag, request_item_tags, request_update_tag } from "../../global/scripts/manage_tag";
import { get_local_preview, save_local_preview, remove_local_preview} from "../../global/scripts/manage_local_preview";
import { get_watch_state } from "../../global/scripts/manage_watch_state";
import { request_add_download_task } from "../../global/scripts/manage_download";
import open_external from '../scripts/open_external';
import write_crash_log from '../../global/scripts/write_crash_log';
import { get_data_storage_dir } from '../../global/scripts/manage_data_storage_dir';

const FETCH_UPDATE_INTERVAL = 3; // In Hours
let FIRST_RUN_TIMEOUT:any;


const Preview = () => {
    const navigate = useNavigate();

    const source_random_color = useRef(randomColor({luminosity:"bright",format: 'rgba',alpha:0.8}));

    const { source_id, preview_id }:any = useParams();
    
    
    const { app_ready, set_feedback_snackbar } = useContext<any>(global_context);

    const [widget, set_widget] = useState<any>({type:"", onSubmit:()=>{}, onClose:()=>{}});
    const [is_ready, set_is_ready] = useState<boolean>(false);
    const [is_update, set_is_update] = useState<any>({state:false,error:false,message:""})
    const [is_online, set_is_online] = useState<boolean>(false);
    const [download_mode, set_download_mode] = useState<any>({state:false,select_type:"manual"});
    const selected_download_data = useRef<any>([])
    const selected_download_season_id = useRef<string>("")
    
    const [TAG_DATA, SET_TAG_DATA] = useState<any>([])
    const [SEASON_INFO, _] = useState<{id:string}[]>([]);
    const [SEASON_ID, SET_SEASON_ID] = useState<string>("0");
    const [SEASON_INDEX, SET_SEASON_INDEX] = useState<number>(0);
    const [INFO, SET_INFO] = useState<any>({});
    const [STATS, SET_STATS] = useState<any>({});
    const [EPISODE_DATA, SET_EPISODE_DATA] = useState<any>([]);
    const [TYPE_SCHEMA, SET_TYPE_SCHEMA] = useState<number>(0);
    const [SERVER_TYPE_SCHEMA, SET_SERVER_TYPE_SCHEMA] = useState<number>(0);

    const [CURRENT_SEASON_INDEX, SET_CURRENT_SEASON_INDEX] = useState<number>(0);
    const [CURRENT_WATCH_ID, SET_CURRENT_WATCH_ID] = useState<string>("");
    const [CURRENT_WATCH_INDEX, SET_CURRENT_WATCH_INDEX] = useState<number>(-1);
    const [CURRENT_WATCH_TIME, SET_CURRENT_WATCH_TIME] = useState<number>(0);
    

    const [selected_tag, set_selected_tag] = useState<any>([]);
    const [show_more_info, set_show_more_info] = useState<boolean>(false)
    const [current_page, set_current_page] = useState<number>(1);
    const [is_error, set_is_error] = useState<any>({state:false,message:"Unable to request source preview"});

    const last_selected_tag = useRef<any>([]);

    // Manage Tag Event
    useEffect(()=>{
        if (!is_ready) return;
        (async () => {
            const removed_tag = last_selected_tag.current.filter((item:string) => !selected_tag.includes(item));
            for (const tag of removed_tag) {
                await request_remove_from_tag({tag_name:tag,source_id,preview_id});
                set_feedback_snackbar({state:true, type:"warning", text:`Removed from tag [${tag}] successfully.`});
            }
            const added_tag = selected_tag.filter((item:string) => !last_selected_tag.current.includes(item));
            for (const tag of added_tag) {
                
                await request_add_to_tag({tag_name:tag,source_id,preview_id,title:INFO.title});
                set_feedback_snackbar({state:true, type:"info", text:`Added to tag [${tag}] successfully.`});
            }
            const local_preview_result = await get_local_preview({source_id,preview_id})
            if (selected_tag.length && added_tag.length){
                if (local_preview_result.code === 200){
                    const data = local_preview_result.result
                    await save_local_preview({
                        source_id,preview_id,
                        data:{
                            ...data,
                            server_type_schema:SERVER_TYPE_SCHEMA,
                            type_schema:TYPE_SCHEMA,
                            info:INFO,
                            stats:STATS,
                            episodes:EPISODE_DATA,
                            last_update: dayjs.utc().unix(),
                        },
                    },{update_cover:"optional"});
                }else{
                    await save_local_preview({
                        source_id,preview_id,
                        data:{
                            server_type_schema:SERVER_TYPE_SCHEMA,
                            type_schema:TYPE_SCHEMA,
                            info:INFO,
                            stats:STATS,
                            episodes:EPISODE_DATA,
                            last_update: dayjs.utc().unix(),
                        },
                    },{update_cover:"optional"});
                }
                
            }else if (selected_tag.length && local_preview_result.code !== 200){
                await save_local_preview({
                    source_id,preview_id,
                    data:{
                        server_type_schema:SERVER_TYPE_SCHEMA,
                        type_schema:TYPE_SCHEMA,
                        info:INFO,
                        stats:STATS,
                        episodes:EPISODE_DATA,
                        last_update: dayjs.utc().unix(),
                    },
                },{update_cover:"optional"});
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
        return {code:200,message:"OK",data:request_tag_data_result.data}
    },[])

    const get_data = useCallback(async ({mode}:{mode:string}) => {
        set_is_ready(false);
        set_is_error({state:false,message:""});
        if (mode === "update") set_is_update({...is_update, state:true,error:false})
        else set_is_update({ state:false,error:false, message:""});
        
        if (mode === "update") set_is_ready(true)

        const request_preview_result = await get_preview({source_id,preview_id});
        if (request_preview_result.code === 200) {
            SET_SEASON_ID((request_preview_result.result.type_schema||1) === 1 ? "0" : SEASON_INFO.length > 0 ? SEASON_INFO?.[CURRENT_SEASON_INDEX]?.id : (CURRENT_SEASON_INDEX+1).toString());
            selected_download_season_id.current = (request_preview_result.result.type_schema||1) === 1 ? "0" : SEASON_INFO.length > 0 ? SEASON_INFO?.[CURRENT_SEASON_INDEX]?.id : (CURRENT_SEASON_INDEX+1).toString();
            SET_TYPE_SCHEMA(request_preview_result.result.type_schema||1)
            SET_SERVER_TYPE_SCHEMA(request_preview_result.result.server_type_schema||1)
            SET_INFO(request_preview_result.result.info);
            SET_STATS(request_preview_result.result.stats);
            SET_EPISODE_DATA(request_preview_result.result.episodes);
            if (mode === "update") {
                const local_preview_result = await get_local_preview({source_id,preview_id})
                if (local_preview_result.code === 200){
                    const data = local_preview_result.result
                    await save_local_preview({
                        source_id,preview_id,
                        data:{
                            ...data,
                            server_type_schema: request_preview_result.result.server_type_schema,
                            type_schema: request_preview_result.result.type_schema,
                            info:request_preview_result.result.info,
                            stats:request_preview_result.result.stats,
                            episodes:request_preview_result.result.episodes,
                            last_update: dayjs.utc().unix(),
                        },
                    });
                }else{
                    await save_local_preview({
                        source_id,preview_id,
                        data:{
                            server_type_schema: request_preview_result.result.server_type_schema,
                            type_schema: request_preview_result.result.type_schema,
                            info:request_preview_result.result.info,
                            stats:request_preview_result.result.stats,
                            episodes:request_preview_result.result.episodes,
                            last_update: dayjs.utc().unix(),
                        },
                    });
                };
                await request_update_tag({source_id,preview_id,title:request_preview_result.result.info.title})
            }
            
        }else if (mode === "get") {
            set_is_error({state:true,message:"Failed to request source."});
            return;
        }else if (mode === "update"){
            set_is_update({state:false,error:true, message:"Failed to request preview update." })
            set_feedback_snackbar({state:true, type:"error", text:"Failed to request preview update. You can report your `crash.log` to admin."});
            await write_crash_log(`[Failed to request preview update]: ${JSON.stringify(request_preview_result)}`);
        }

        set_is_update({state:false,error:false, message:""})
        set_is_ready(true);
    },[CURRENT_SEASON_INDEX, TYPE_SCHEMA])

    // Main Running event
    useEffect(()=>{
        if (!app_ready) return;
        set_is_ready(false);
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            const load_tag_result = await load_tag_data();
            if (load_tag_result.code !== 200) {
                set_is_error({state:true,message:load_tag_result.message});
                return;
            };
            
            const is_online_result = await check_internet_connection();
            set_is_online(is_online_result);
            const local_preview_result = await get_local_preview({source_id,preview_id})
            if (load_tag_result.data.length > 0 && local_preview_result.code === 200){
                console.log("LL IT GO HERE", load_tag_result.data.length)
                const data = local_preview_result.result;
                SET_SEASON_INDEX(data.season_index ?? 0);
                SET_SEASON_ID((data.type_schema||1) === 1 ? "0" : SEASON_INFO.length > 0 ? SEASON_INFO?.[data.season_index??0]?.id : ((data.season_index??0)+1).toString());
                selected_download_season_id.current = (data.type_schema||1) === 1 ? "0" : SEASON_INFO.length > 0 ? SEASON_INFO?.[data.season_index??0]?.id : ((data.season_index??0)+1).toString();
                SET_CURRENT_SEASON_INDEX(data.season_index ?? 0);
                SET_CURRENT_WATCH_ID(data.watch_id ?? "");
                SET_CURRENT_WATCH_INDEX(data.watch_index ?? -1);
                SET_TYPE_SCHEMA(data.type_schema||1)
                SET_SERVER_TYPE_SCHEMA(data.server_type_schema||1)
                SET_INFO(data.info)
                SET_STATS(data.stats)
                SET_EPISODE_DATA(data.episodes)
                try{
                    if (data.watch_id){
                        const watch_state_result = await get_watch_state({
                            source_id,
                            preview_id,
                            season_id:(data.type_schema||1) === 1 ? "0" : SEASON_INFO.length > 0 ? SEASON_INFO?.[data.season_index??0]?.id : ((data.season_index??0)+1).toString(),
                            watch_id:data.watch_id});
                        if (watch_state_result.code === 200){
                            SET_CURRENT_WATCH_TIME(watch_state_result.data.current_time??0);
                        }
                    }
                    if (dayjs.utc().unix() - (data.last_update??0) <= FETCH_UPDATE_INTERVAL * 60 * 60) {
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
        }, import.meta.env.DEV ? 1500 : 0);

        return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[app_ready])
    // ====================

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

    const SEASON_COMPONENT = useCallback(({index}:any)=>{

        return (<>
            <ButtonBase 
                sx={{
                    padding:"25px",
                    color: "var(--color)",
                    background: "var(--background-color-layer-1)",
                    borderRadius: "8px",
                    border: `2px solid ${SEASON_INDEX == index ? "var(--color-2)" :"var(--background-color)"}`,
                    whiteSpace: 'nowrap'
                }}
                
                onClick={()=>{

                    SET_SEASON_INDEX(index);
                    SET_SEASON_ID(TYPE_SCHEMA === 1 ? "0" : SEASON_INFO.length > 0 ? SEASON_INFO?.[index]?.id : (index+1).toString());
                    selected_download_season_id.current = TYPE_SCHEMA === 1 ? "0" : SEASON_INFO.length > 0 ? SEASON_INFO?.[index]?.id : (index+1).toString();
                }}
            >
                Season {index+1}
            </ButtonBase>
            
        </>)
    },[SEASON_INDEX, SEASON_INFO, TYPE_SCHEMA])

    const EPISODE_COMPONENT = useCallback(({item}:any)=>{
        const [is_checked_for_download, set_is_checked_for_download] = useState<boolean>(false);
        const [available_local, set_available_local] = useState<boolean>(false);
        const [watch_state, set_watch_state] = useState<boolean>(false);

        useEffect(()=>{
            if (!download_mode.state) return;
            if (download_mode.select_type === "all"){
                set_is_checked_for_download(true)
            }else{
                if (selected_download_data.current.some((i:any) => i.index === item.index && i.id === item.id)){
                    set_is_checked_for_download(true)
                }else{
                    set_is_checked_for_download(false)
                }
            }
        },[download_mode])

        useEffect(()=>{
            ;(async ()=>{
                const main_dir = await path.join(await get_data_storage_dir(), source_id, preview_id, SEASON_ID);

                const download_manifest_path = await path.join(main_dir, "download", item.id, "manifest.json");

                try{
                    if (await exists(download_manifest_path)){
                        JSON.parse(await readTextFile(download_manifest_path, {baseDir:BaseDirectory.AppData}))
                        set_available_local(true);
                    }else{
                        set_available_local(false);
                    }
                    
                }catch{
                    set_available_local(false);
                }

                const watch_state_path = await path.join(main_dir, "watch_state", `${item.id}.json`);
                try{
                    if (await exists(watch_state_path)){
                        JSON.parse(await readTextFile(watch_state_path, {baseDir:BaseDirectory.AppData}))
                        set_watch_state(true);
                    }else{
                        set_watch_state(false);
                    }
                }catch{
                    set_watch_state(false);
                }
            })()
        },[])

        return <div
            style={{
                display:"flex",
                flexDirection:"row",
                width:"100%",
                height: "auto",
                alignItems:"center",
                gap:"8px",
            }}
        >
            
            <ButtonBase
                style={{
                    flex:1,
                    borderRadius:"12px",
                    background: ((parseInt(item.index,10) === CURRENT_WATCH_INDEX) && (SEASON_INDEX === CURRENT_SEASON_INDEX)) ? "var(--selected-menu-background-color)" : watch_state ? "var(--background-color-layer-1)" : "var(--background-color)",
                    color:"var(--color)",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"flex-start",
                    padding:"12px",
                    border:"2px solid var(--background-color-layer-1)",
                    fontFamily: "var(--font-family-medium)",
                    fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                    boxSizing:"border-box",
                    
                }}
                onClick={async ()=>{
                    set_is_ready(false);
                    const local_preview_result = await get_local_preview({source_id,preview_id});
                    if (local_preview_result.code === 200){
                        const data = local_preview_result.result
                        await save_local_preview({
                            source_id,preview_id,
                            data:{
                                ...data,
                                season_index:SEASON_INDEX,
                                watch_index:parseInt(item.index,10),
                                watch_id:item.id
                            },
                        });
                    }
                    navigate(encodeURI(`/watch/${source_id}/${preview_id}/${SEASON_ID}/${item.id}`));
                }}
            >
                <span><span style={{fontFamily: "var(--font-family-bold)"}}>Episode {item.index+1}: </span>{item.title}</span>
            </ButtonBase>
            <>{available_local && !download_mode.state &&
                <Tooltip title="Available in storage">
                    <SaveRoundedIcon sx={{color:"var(--color-2)", fontSize: "calc((100vw + 100vh) * 0.045 / 2)",}} />
                </Tooltip>
            }</>
            <>{download_mode.state && !available_local &&
                <Checkbox sx={{color:"var(--color)"}} 
                    checked={is_checked_for_download}
                    onChange={(e)=>{
                        const is_check = e.target.checked;
                        if (is_check){
                            selected_download_data.current.push(item)
                            set_is_checked_for_download(true)
                        }else{
                            const update_select = selected_download_data.current.filter((i:any) => !(i.index === item.index && i.id === item.id))
                            selected_download_data.current = update_select;
                            if (download_mode.select_type != "manual") set_download_mode({...download_mode, select_type:"manual"});
                            set_is_checked_for_download(false)
                        }
                    }}
                    
                />
            }</>
            <>{download_mode.state && available_local &&
                <Tooltip title="Remove from storage">
                    <IconButton 
                        onClick={()=>{
                            set_widget({type:"remove_download", onSubmit: async ()=>{
                                const main_dir = await path.join(await get_data_storage_dir(), source_id, preview_id, SEASON_ID, "download", item.id);
                                await remove(main_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
                                set_available_local(false);
                            }});
                        }}
                    >
                        <DeleteForeverRoundedIcon sx={{color:"red", fontSize: "calc((100vw + 100vh) * 0.045 / 2)",}} />
                    </IconButton>
                    
                </Tooltip>
            }</>
        </div>
    },[download_mode,CURRENT_WATCH_INDEX, SEASON_INDEX, CURRENT_SEASON_INDEX, TYPE_SCHEMA])


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
                    <Button variant="contained" color='secondary'
                        onClick={async ()=>{
                            await open_external({source_id,preview_id});
                        }}
                    >Open in external browser</Button>
                    <div style={{
                        display:"flex",
                        flexDirection:"row",
                        gap:"12px",
                    }}>
                        
                        <Button variant="text"
                            onClick={()=>{
                                if (window.history.state && window.history.state.idx > 0) {
                                    navigate(-1);
                                } else {
                                    console.error("No history to go back to");
                                }
                            }}
                        >Go back</Button>
                        <Button variant="contained"
                            onClick={async ()=>{
                                await get_data({mode:"get"});
                            }}
                        >Retry</Button>
                    </div>
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
                                <ArrowBackRoundedIcon sx={{color:"var(--icon-color-1)"}} fontSize="medium"/>
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
                                            <CircularProgress color="secondary" size="calc((100vw + 100vh)*0.035/2)"/>
                                        </Tooltip>
                                        : <Tooltip title={`Fetch update: Auto every ${FETCH_UPDATE_INTERVAL} hours`}>
                                            <IconButton color="primary" size="large"
                                                onClick={async ()=>{
                                                    await get_data({mode:"update"});
                                                }}
                                            >
                                                <PublishedWithChangesRoundedIcon color="success" fontSize="medium"/>
                                            </IconButton>
                                            
                                        </Tooltip>
    
                                    }</>                         
                                }</>
                                
                                <IconButton color="primary" size="large"
                                    onClick={()=>{
                                        if (selected_tag.length === 0) {
                                            set_feedback_snackbar({state:true,type:"warning",text:"Required to add this content to Watchlist before download."});
                                            return;
                                        }
                                        set_download_mode({...download_mode,state:!download_mode.state,select_type:"manual"});
                                        if (download_mode.state) {
                                            selected_download_data.current = []
                                        }else{
                                            const element = document.getElementById('ep_container');
                                            element?.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    {download_mode.state
                                        ? <CloseRoundedIcon sx={{color:"red"}} fontSize="medium"/>
                                        : <DownloadRoundedIcon sx={{color:"var(--icon-color-1)"}} fontSize="medium"/>
                                    }
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
                                        <>{CURRENT_WATCH_TIME > 0 &&
                                            <div className={styles.cover_overlay}>
                                                <div
                                                    style={{
                                                        width:"auto",
                                                        minWidth:"50%",
                                                        height:"auto",
                                                        background:"purple",
                                                        padding: "4px",
                                                        borderRadius:"6px",
                                                        display:"flex",
                                                        alignItems:'center',
                                                        justifyContent:"center",
                                                        boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px"
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontFamily:"var(--font-family-medium)",
                                                            color:"var(--color)",
                                                            fontSize:"calc((100vw + 100vh) * 0.0225 / 2)",
                                                        }}
                                                    >{dayjs.duration(CURRENT_WATCH_TIME, "seconds").format("H[h] m[m] s[s]").replace(/\b0[hms]\s?/g, "").trim()}</span>
                                                </div>
                                            </div>
                                        }</>
                                    </div>
                                    
                                    <FormControl sx={{ maxWidth: "calc((100vw + 100vh) * 0.2 / 2)"}}>
                                        <InputLabel sx={{color:"var(--color)"}}>Watchlist</InputLabel>
                                        <Select
                                            sx={{color:"var(--color)", background:"var(--background-color-layer-1)"}}
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
                                                background: source_random_color.current,
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
                                            onClick={async ()=>{
                                                if (CURRENT_WATCH_INDEX > -1 && selected_tag.length > 0) {
                                                    navigate(encodeURI(`/watch/${source_id}/${preview_id}/${SEASON_ID}/${CURRENT_WATCH_ID}`));
                                                }else{
                                                    const watch_id = EPISODE_DATA?.[0]?.[0]?.[0]?.id??null;
                                                    const watch_index = EPISODE_DATA?.[0]?.[0]?.[0]?.index??null;
                                                    if ((watch_id !== null) && (watch_index !== null)) {
                                                        set_is_ready(false);
                                                        const local_preview_result = await get_local_preview({source_id,preview_id});
                                                        if (local_preview_result.code === 200){
                                                            const data = local_preview_result.result
                                                            await save_local_preview({
                                                                source_id,preview_id,
                                                                data:{
                                                                    ...data,
                                                                    season_index: SEASON_INDEX,
                                                                    watch_index: watch_index,
                                                                    watch_id:watch_id
                                                                },
                                                            });
                                                        }
                                                        navigate(encodeURI(`/watch/${source_id}/${preview_id}/${SEASON_ID}/${watch_id}`));
                                                    }else{
                                                        console.error("Unable to navigate. Episode data not found.");
                                                    }
                                                }
                                                
                                            }}
                                        >
                                            <>{CURRENT_WATCH_INDEX > -1 && selected_tag.length > 0
                                                ? <>
                                                    <span style={{fontFamily: "var(--font-family-bold)"}}>Continues</span>
                                                    <span style={{fontFamily: "var(--font-family-light)"}}>{TYPE_SCHEMA===2 ? `Season ${CURRENT_SEASON_INDEX+1} | `:""}Episode: {CURRENT_WATCH_INDEX+1}</span>
                                                </>
                                                : <>
                                                    <span style={{fontFamily: "var(--font-family-bold)"}}>Watch now</span>
                                                    <span style={{fontFamily: "var(--font-family-light)"}}>{TYPE_SCHEMA===2 ? "Season 1 | ":""}Episode: 1</span>
                                                </>
                                            }</>
                                            
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
                                        {!["cover","local_cover","description", "title"].includes(item_key) && (
                                            <span
                                                style={{
                                                    fontFamily: "var(--font-family-regular)",
                                                    color: "var(--color)",
                                                    fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                                    wordBreak:"break-word",
                                                }}
                                            >
                                                <span style={{fontFamily: "var(--font-family-bold)"}}>
                                                {item_key[0].toUpperCase() + item_key.slice(1)}</span> {INFO[item_key]}
                                            </span>
                                        )}
                                    </Fragment>))
                                    }</>
                                </div>

                            </div>
                        
                            <>{TYPE_SCHEMA === 2 && !download_mode.state &&
                                <div className={styles.season_box}>
                                    <>{[...Array(EPISODE_DATA.length)].map((_, index) => (
                                        <SEASON_COMPONENT key={index} index={index}/>

                                    ))}</>
                                </div>
                            }</>
                            
                            <div id="ep_container" className={styles.body_box_3}>
                                <>{download_mode.state &&
                                    <div
                                        style={{
                                            width:"100%",
                                            height:"auto",
                                            display:"flex",
                                            justifyContent:"flex-end",
                                            borderBottom:"3px solid var(--background-color-layer-1)",
                                            padding:"8px",
                                        }}
                                    >
                                        <Tooltip title={download_mode.select_type === "all" ? "Deselect All" : "Select All"}>
                                            <ButtonBase
                                                sx={{
                                                    color:"var(--color)",
                                                    borderRadius:"8px"
                                                }}
                                                onClick={()=>{
                                                    if (download_mode.select_type != "all"){
                                                        const new_data:any = []
                                                        for (const item of EPISODE_DATA[SEASON_INDEX]){
                                                            new_data.push(...item)
                                                        }
                                                        selected_download_data.current = new_data;
                                                    }else{
                                                        selected_download_data.current = [];
                                                    }
                                                    set_download_mode({
                                                        ...download_mode,
                                                        select_type: download_mode.select_type === "all" ? "manual" : "all",
                                                    })
                                                }}
                                            >
                                                {download_mode.select_type === "all"
                                                    ? <DeselectRoundedIcon fontSize="large"/>
                                                    : <SelectAllRoundedIcon fontSize="large"/>
                                                }
                                                
                                            </ButtonBase>
                                        </Tooltip>
                                    </div>
                                }</>
                                
                                <>{EPISODE_DATA?.length > 0
                                    ? <>{EPISODE_DATA[SEASON_INDEX][current_page-1].map((item:any,index:number)=>(
                                        <EPISODE_COMPONENT key={index} item={item}/>
                                    ))}</>
                                    : <></>
                                }</>
                            </div>
                            <div className={styles.body_box_4}>
                                <Pagination count={EPISODE_DATA[SEASON_INDEX].length} page={current_page} color="primary" showFirstButton showLastButton
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

            <>{download_mode.state &&
                <div
                    style={{
                        position:"absolute",
                        width:"100vw",
                        height:"100vh",
                        top:0,left:0,
                        background:"transparent",
                        display:"flex",
                        justifyContent:"flex-end",
                        alignItems:"flex-end",
                        pointerEvents:"none",
                        padding:"12px",
                    }}
                >
                    <div style={{pointerEvents:"all"}}>
                        <Fab color="secondary" variant="extended"
                            sx={{
                                zIndex:1
                            }}
                            onClick={()=>{
                                
                                set_widget({type:"manage_download"});
                                
                            }}
                        >
                            
                            Add to Download Task
                            <DownloadForOfflineRoundedIcon />
                        </Fab>
                    </div>
                </div>
            }</>
            
            <AnimatePresence>
                <>{widget.type === "manage_download" && <ManageDownloadWidget
                    {...{
                        source_id, preview_id,
                        season_id: selected_download_season_id.current,
                        server_type_schema:SERVER_TYPE_SCHEMA,
                        selected_data:selected_download_data.current,
                        onClose:()=>{set_widget({type:""})},
                        onSubmit:async (options:any)=>{
                            const selected_data = selected_download_data.current
                            if (selected_data.length === 0){
                                set_feedback_snackbar({state:true,type:"warning",text:"No episode selected."});
                                return
                            }
                            set_feedback_snackbar({state:true,type:"info",text:"Adding to download task..."});
                            for (const data of selected_data){
                                await request_add_download_task({
                                    source_id: source_id??"",
                                    preview_id: preview_id??"",
                                    season_id: selected_download_season_id.current,
                                    title:data.title,
                                    watch_index: data.index,
                                    watch_id: data.id,
                                    quality: options.quality,
                                    server_type: options.server_type,
                                    server_id: options.server_id||"",
                                    type_schema:TYPE_SCHEMA,
                                })
                            }
                            set_widget({type:""});
                            set_download_mode({...download_mode,state:false,select_type:"manual"});
                            selected_download_data.current = []
                            set_feedback_snackbar({state:true,type:"info",text:"Added to download task successfully."});
                        }
                        
                    }}
                />}</>

                <>{widget.type === "remove_download" && <RemoveDownloadWidget
                    {...{

                        onClose:()=>{set_widget({type:""})},
                        onSubmit: widget.onSubmit,
                        
                    }}
                />}</>
            </AnimatePresence>

        </div>
        
    );
}

export default Preview;