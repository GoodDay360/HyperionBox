

// Tauri Plugins
import { path } from "@tauri-apps/api";
import { getCurrentWindow } from "@tauri-apps/api/window"
import { BaseDirectory, exists, readTextFile } from "@tauri-apps/plugin-fs";

// React Imports
import { useEffect, useState, useRef, useContext, useCallback, } from 'react';
import { useNavigate, useParams, useSearchParams } from "react-router";

// Lazy Images Imports


// Vidstack Imports
import { MediaPlayer, MediaProvider, isHLSProvider, MediaPlayerInstance,  } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { useMediaState } from "@vidstack/react";


// MUI Imports
import { ButtonBase, IconButton, Button, Tooltip } from "@mui/material";
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';


// MUI Icons
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PublishedWithChangesRoundedIcon from '@mui/icons-material/PublishedWithChangesRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';

// Disqus Imports
import { DiscussionEmbed } from 'disqus-react';

// Media Imports
import Blocks_Loading from "../../assets/images/blocks_loading.svg";


// Styles Imports
import styles from "../styles/main.module.css";
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

// Custom Imports
import { global_context } from '../../global/scripts/contexts';
import get_watch from "../scripts/get_watch";
import generate_hls_from_playlist from "../../global/scripts/generate_hls_from_playlist";
import { convertFileSrc } from "@tauri-apps/api/core";
import { request_item_tags } from "../../global/scripts/manage_tag";
import { get_watch_state, update_watch_state } from "../../global/scripts/manage_watch_state";
import { get_local_preview,save_local_preview } from "../../global/scripts/manage_local_preview";
import check_internet_connection from "../../global/scripts/check_internet_connection";
import rephrase_local_hls from "../scripts/rephrase_local_hls";
import open_external from "../scripts/open_external";
import { get_source_info } from "../../global/scripts/manage_extension";

const FETCH_UPDATE_INTERVAL = 6; // In hours
let FIRST_RUN_TIMEOUT:any;

function Watch() {
    const navigate = useNavigate();
    const {app_ready} = useContext<any>(global_context);
    
    const { source_id, preview_id, season_id, watch_id }:any = useParams();
    const [searchParams] = useSearchParams();

    const [is_online, set_is_online] = useState<boolean>(false);
    const [is_ready, set_is_ready] = useState<boolean>(false);
    const [is_error, set_is_error] = useState<any>({state:false,message:""});
    const [is_media_ready, set_is_media_ready] = useState<boolean>(false);
    
    const [is_update, set_is_update] = useState<any>({state:false,error:false,message:""})
    const [is_in_watchlist, set_is_in_watchlist] = useState<boolean>(false);
    const [current_page, set_current_page] = useState<number>(1);

    const [_, SET_SOURCE_INFO] = useState<any>({});
    const [CURRENT_SEASON_ID, __] = useState<string>(season_id);
    const [CURRENT_SEASON_INDEX, ___] = useState<number>(0);
    const [SERVER_INFO, SET_SERVER_INFO] = useState<any>({});
    const [EPISODE_DATA, SET_EPISODE_DATA] = useState<any>([]);
    const [MEDIA_SRC, SET_MEDIA_SRC] = useState<string>("");
    const [MEDIA_TRACK, SET_MEDIA_TRACK] = useState<any>([]);
    const [MEDIA_TYPE, SET_MEDIA_TYPE] = useState<string>("");

    const media_player_ref:any = useRef<MediaPlayerInstance>(null);
    const isFullscreen = useMediaState("fullscreen", media_player_ref);
    const media_player_state_ref = useRef<any>({});

    useEffect(()=>{
        (async ()=>{
            if (isFullscreen){
                await getCurrentWindow().setFullscreen(true)
                sessionStorage.setItem("fullscreen", "yes")
            }else{
                await getCurrentWindow().setFullscreen(false)
                sessionStorage.setItem("fullscreen", "no")
            }
        })();
        return;
    },[isFullscreen])

    let update_state_interval:any = null;
    let is_updating_state = false
    useEffect(() => {
        if (!is_ready || is_error.state) return;
        if (media_player_ref.current !== null) {
            if (!is_media_ready || !is_in_watchlist){
                media_player_ref.current.currentTime = 0;
                clearInterval(update_state_interval);
                return;
            }else{
                media_player_ref.current.currentTime = media_player_state_ref.current?.current_time || -1;
                clearInterval(update_state_interval);
                update_state_interval = setInterval(async () => {
                    if (is_updating_state) return;
                    is_updating_state = true
                    const player_state = media_player_ref.current;

                    await update_watch_state({source_id,preview_id,watch_id,
                        state:{
                            current_time: player_state.currentTime,
                            server_id: SERVER_INFO.current_server_id,
                            server_type: SERVER_INFO.current_server_type
                        }
                    });


                    is_updating_state = false
                }, 3000);
            }
        }
        return () => {
            clearInterval(update_state_interval);
        }
    }, [is_media_ready,is_in_watchlist, is_ready, is_error]);

    const get_data = async ({watch_id,server_type=null,server_id=null,check_local=true,force_update=false}:{watch_id:string,server_type?:string|null,server_id?:string|null,check_local?:boolean,force_update?:boolean}) =>{
        set_is_ready(false);
        set_is_media_ready(false);
        set_is_update({state:true,error:false,message:""});
        media_player_state_ref.current = {};
        try{
            const is_online_result = await check_internet_connection();
            set_is_online(is_online_result);
            const request_item_tags_result:any = await request_item_tags({source_id,preview_id});
            if (request_item_tags_result?.code === 200) {
                if (request_item_tags_result?.data?.length > 0) {
                    const get_watch_state_result = await get_watch_state({source_id,preview_id,watch_id});
                    if (get_watch_state_result.code === 200) {
                        media_player_state_ref.current = get_watch_state_result.data;
                    }else{
                        media_player_state_ref.current = {};
                    }
                    set_is_in_watchlist(true)
                }else set_is_in_watchlist(false);
            }else set_is_in_watchlist(false);

            let get_watch_result;
            if (request_item_tags_result?.data?.length > 0){
                get_watch_result = await get_watch({
                    source_id,preview_id,watch_id,
                    server_type: server_type || media_player_state_ref.current.server_type, 
                    server_id: server_id || media_player_state_ref.current.server_id,
                    check_local,force_update,
                });

            }else{
                get_watch_result = await get_watch({
                    source_id,preview_id,watch_id,
                    server_type,server_id,
                    force_update,
                });
            }
            
            if (get_watch_result.code === 200) {
                const data = get_watch_result.result;
                console.log("REQUEST RESULT", data);
                SET_EPISODE_DATA(data.episodes);
                SET_MEDIA_TRACK(data.media_info.track);
                SET_MEDIA_TYPE(data.media_info.type);
                if (data.media_info.type === "local"){
                    const rephrased_hls_result:any = await rephrase_local_hls({input_file_path: data.media_info.source[0].uri})
                    if (rephrased_hls_result.code === 200){
                        SET_MEDIA_SRC(rephrased_hls_result.result);
                    }
                    
                }else{
                    SET_SERVER_INFO(data.server_info);
                    const playlist_path = await path.join(await path.appDataDir(), ".cache", "watch", "current_playlist.m3u8")
                    const generate_hls_result = await generate_hls_from_playlist({
                        source:data.media_info.source,
                        output: playlist_path,
                    })
                    if (generate_hls_result.code === 200){
                        SET_MEDIA_SRC(convertFileSrc(playlist_path));
                    }
                }
            }else{
                console.log("WAH", get_watch_result);
                set_is_error({state:true,message:get_watch_result.message});
            }
        }catch(e){
            set_is_update({state:false,error:true,message:"Failed to request data. Check your crash log and report to developer."});
            console.error(e);
        }
        set_is_update({state:false,error:false,message:""});
        set_is_ready(true);
    }

    useEffect(()=>{
        if (!app_ready) return;
        set_is_ready(false);
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            const get_source_info_result = await get_source_info({id:source_id});
            if (get_source_info_result.code === 200) {
                SET_SOURCE_INFO(get_source_info_result.data);
            }
            await get_data({
                watch_id,
                server_type:searchParams.get("server_type"),
                server_id:searchParams.get("server_id"),
                force_update:false
            });
            set_is_ready(true);
        }, import.meta.env.DEV ? 1500 : 0);
        return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[app_ready]);

    const onProviderChange = (provider:any) => {
        if (isHLSProvider(provider)) {
          provider.library = () => import('hls.js'); // Load hls.js dynamically
        }
    }

    const RenderItem = useCallback(({item}:any)=>{
        const [available_local, set_available_local] = useState<boolean>(false);
        const [watch_state, set_watch_state] = useState<boolean>(false);


        useEffect(()=>{
            ;(async ()=>{
                const main_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id, season_id);

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

        return (<div
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
                    background:item.id === watch_id ? "var(--selected-menu-background-color)" : watch_state ? "var(--background-color-layer-1)" : "var(--background-color)",
                    color:"var(--color)",
                    display:"flex",
                    alignItems:"center",
                    justifyContent:"flex-start",
                    padding:"12px",
                    border:"2px solid var(--background-color-layer-1)",
                    fontFamily: "var(--font-family-medium)",
                    fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                }}
                
                onClick={async ()=>{
                    set_is_ready(false);
                    navigate(`/watch/${source_id}/${preview_id}/${CURRENT_SEASON_ID}/${item.id}`, {replace: true});
                    const local_preview_result = await get_local_preview({source_id,preview_id});
                    if (local_preview_result.code === 200){
                        const data = local_preview_result.result
                        await save_local_preview({
                            source_id,preview_id,
                            data:{
                                ...data,
                                watch_index:parseInt(item.index,10),
                                watch_id:item.id
                            },
                        });
                    }
                    await get_data({watch_id:item.id,force_update:false});
                }}
            >
                <span><span style={{fontFamily: "var(--font-family-bold)"}}>Episode {item.index}: </span>{item.title}</span>
            </ButtonBase>
            <>{available_local &&
                <Tooltip title="Available in storage">
                    <SaveRoundedIcon sx={{color:"var(--color-2)", fontSize: "calc((100vw + 100vh) * 0.045 / 2)",}} />
                </Tooltip>
            }</>
        </div>)
    },[watch_id]);
    
    return (<>
        <div className={styles.container}>
            <>{!is_error.state
                ? <>{is_ready
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
                                                    await get_data({
                                                        watch_id,
                                                        server_type:searchParams.get("server_type"),server_id:searchParams.get("server_id"),
                                                        force_update:true
                                                    });
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
                                        : <Tooltip title={`Fetch update: Auto every ${FETCH_UPDATE_INTERVAL} hours`}>
                                            <IconButton color="primary" size="large"
                                                onClick={async ()=>{
                                                    await get_data({
                                                        watch_id,
                                                        server_type:searchParams.get("server_type"),server_id:searchParams.get("server_id"),
                                                        force_update:true,
                                                        check_local:false
                                                    });
                                                }}
                                            >
                                                <PublishedWithChangesRoundedIcon color="success" fontSize="large"/>
                                            </IconButton>
                                            
                                        </Tooltip>

                                    }</>                         
                                }</>
                                
                                
                                
                                
                            </div>
                        </div>
                        <div className={styles.body}>
                            <div className={styles.body_box_1}>
                                <div
                                    style={{
                                        flex:1,
                                        minWidth:"200px",
                                        display:"flex",
                                        boxSizing:"border-box",
                                    }}
                                >
                                    <MediaPlayer ref={media_player_ref} 
                                        style={{
                                            boxSizing:"border-box",
                                        }}
                                        title={`Watching: ${preview_id}-${watch_id}`}
                                        onProviderChange={onProviderChange}
                                        src={MEDIA_SRC}
                                        onLoadedData={()=>{
                                            set_is_media_ready(true);
                                        }}
                                        storage="vidstack"
                                        streamType='on-demand'
                                        viewType='video'
                                        playsInline crossOrigin
                                    >
                                        <MediaProvider>
                                            {MEDIA_TRACK.map((track:any, index:any) => {
                                                return (
                                                    <track
                                                        key={index}
                                                        kind={track.kind}
                                                        src={MEDIA_TYPE === "local" ? convertFileSrc(track.url) : track.url}
                                                        srcLang={track.label} 
                                                        label={track.label}
                                                        
                                                    />
                                                );
                                            })}
                                        </MediaProvider>
                                        <DefaultVideoLayout
                                            colorScheme="dark"
                                            icons={defaultLayoutIcons}
                                        />
                                    </MediaPlayer>
                                </div>
                                <div
                                    style={{
                                        width:"auto",
                                        minWidth:"150px",
                                        height:"100%",
                                        background:"var(--background-color-layer-1)",
                                        display:"flex",
                                        flexDirection:"column",
                                        
                                        borderRadius:"8px",
                                        gap:0,
                                        overflow:"auto",
                                        boxSizing:"border-box",
                                    }}
                                >
                                    <>{MEDIA_TYPE !== "local"
                                        ? <>{Object.keys(SERVER_INFO.server_list).map((server_type:any,index:number)=>(
                                            <div key={index}
                                                style={{
                                                    width:"auto",
                                                    display:"flex",
                                                    flexDirection:"column",
                                                    gap:0,
                                                    flexGrow:0,
                                                    flexShrink:0,
                                                    boxShadow:"rgba(17, 12, 46, 0.15) 0px 48px 100px 0px"
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color:"var(--color)",
                                                        fontFamily:"var(--font-family-bold)",
                                                        fontSize:"calc((100vw + 100vh)*0.0255/2)",
                                                        padding:"8px",
                                                        borderBottom:"2px solid var(--background-color)",
                                                    }}
                                                >{server_type.toUpperCase()}</span>
                                                <div
                                                    style={{
                                                        display:"flex",
                                                        flexDirection:"column",
                                                        gap:"8px",
                                                        width:"auto",
                                                        flexGrow:0,
                                                        flexShrink:0,
                                                        padding:"12px",
                                                    }}
                                                >
                                                    <>{SERVER_INFO.server_list[server_type].map((item_2:any,index_2:number)=>(
                                                        <Button 
                                                            variant={
                                                                (SERVER_INFO.current_server_type === server_type && SERVER_INFO.current_server_id === item_2.server_id) 
                                                                ? "contained"
                                                                : "outlined" 
                                                            } 
                                                            size="medium" color="primary" key={index_2} 
                                                            style={{
                                                                paddingLeft:"calc((100vw + 100vh)*0.0575/2)",
                                                                paddingRight:"calc((100vw + 100vh)*0.0575/2)",
                                                            }}
                                                            onClick={async ()=>{
                                                                if (SERVER_INFO.current_server_type === server_type && SERVER_INFO.current_server_id === item_2.server_id) return;
                                                                navigate(`/watch/${source_id}/${preview_id}/${CURRENT_SEASON_ID}/${watch_id}/?server_type=${server_type}&server_id=${item_2.server_id}`, { replace: true });
                                                                await get_data({
                                                                    watch_id,
                                                                    server_type,
                                                                    server_id:item_2.server_id,
                                                                    force_update:true,
                                                                    check_local:false,
                                                                });
                                                            }}
                                                        >
                                                            {item_2.title}
                                                        </Button>
                                                    ))}</>
                                                </div>
                                                
                                            </div>
                                        ))}</>
                                        : <>
                                            <div
                                                style={{
                                                    width:"auto",
                                                    display:"flex",
                                                    flexDirection:"column",
                                                    gap:0,
                                                    flexGrow:0,
                                                    flexShrink:0,
                                                    boxShadow:"rgba(17, 12, 46, 0.15) 0px 48px 100px 0px"
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color:"var(--color)",
                                                        fontFamily:"var(--font-family-bold)",
                                                        fontSize:"calc((100vw + 100vh)*0.0255/2)",
                                                        padding:"8px",
                                                        borderBottom:"2px solid var(--background-color)",
                                                    }}
                                                >SERVER</span>
                                                <div
                                                    style={{
                                                        display:"flex",
                                                        flexDirection:"column",
                                                        gap:"8px",
                                                        width:"auto",
                                                        flexGrow:0,
                                                        flexShrink:0,
                                                        padding:"12px",
                                                    }}
                                                >
                                                    
                                                    <Button 
                                                        variant="contained"
                                                        size="medium" color="primary"
                                                        style={{
                                                            paddingLeft:"calc((100vw + 100vh)*0.0575/2)",
                                                            paddingRight:"calc((100vw + 100vh)*0.0575/2)",
                                                        }}
                                                        
                                                    >Local</Button>

                                                    <Button 
                                                        variant="outlined"
                                                        size="medium" color="primary"
                                                        style={{
                                                            paddingLeft:"calc((100vw + 100vh)*0.0575/2)",
                                                            paddingRight:"calc((100vw + 100vh)*0.0575/2)",
                                                        }}
                                                        onClick={async ()=>{
                                                            navigate(`/watch/${source_id}/${preview_id}/${CURRENT_SEASON_ID}/${watch_id}/`, { replace: true });
                                                            await get_data({
                                                                watch_id,
                                                                check_local:false,
                                                            });
                                                        }}
                                                    >Switch to online</Button>
                                                    
                                                </div>
                                                
                                            </div>
                                        </>
                                    }</>
                                </div>
                            </div>
                            <div className={styles.body_box_2}>
                                <>{EPISODE_DATA?.length > 0
                                    ? <>{EPISODE_DATA[CURRENT_SEASON_INDEX][current_page-1].map((item:any,index:number)=>(
                                        <RenderItem key={index} item={item}/>
                                    ))}</>
                                    : <></>
                                }</>
                            </div>
                            <div className={styles.body_box_3}>
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
                            <div className={styles.body_box_4}>
                                <>{is_online &&
                                    <DiscussionEmbed
                                        shortname='hyperionbox'
                                        config={
                                            {
                                                identifier: `${source_id}-${preview_id}-${watch_id}`,
                                                title: `${preview_id}: ${watch_id}`,
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
                : <div
                    style={{
                        width:"100%",
                        height:"100%",
                        display:"flex",
                        alignItems:"center",
                        justifyContent:"center",
                        flexDirection:"column",
                        gap:"12px",
                    }}
                >
                    <span
                        style={{
                            color:"var(--color)",
                            fontFamily:"var(--font-family-bold)",
                            fontSize:"calc((100vw + 100vh)*0.0355/2)",
                            textAlign:"center",
                        }}
                    >
                        <span style={{color:"red"}}>[Error]:</span> {is_error?.message?.response?.data?.error || "Unknown error occured."}
                        
                    </span>
                    <Tooltip title="Some source require robot verification for it to work. Try opening it in an external browser.">
                        <Button
                            variant="contained" color="secondary"
                            
                            onClick={async()=>{
                                await open_external({source_id,preview_id,watch_id});
                            }}
                        >
                            Try open in external browser
                        </Button>
                    </Tooltip>
                    <div
                        style={{
                            display:"flex",
                            flexDirection:"row",
                            gap:"12px",
                        }}
                    >
                        <Button
                            variant="outlined" color="primary"
                            onClick={()=>{
                                if (window.history.state && window.history.state.idx > 0) {
                                    navigate(-1);
                                } else {
                                    console.error("No history to go back to");
                                }
                            }}
                        >
                            Go Back
                        </Button>
                        <Button
                            variant="contained" color="primary"
                            onClick={async ()=>{
                                set_is_ready(false);
                                set_is_media_ready(false);
                                set_is_error({state:false,message:""});
                                await get_data({
                                    watch_id,
                                    server_type:searchParams.get("server_type"),
                                    server_id:searchParams.get("server_id"),
                                    force_update:true
                                });
                            }}
                        >
                            Retry
                        </Button>
                        
                    </div>
                </div>
            }</>
        </div>
    </>);
}

export default Watch;
