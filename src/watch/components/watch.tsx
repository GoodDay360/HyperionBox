// Tauri API
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Imports
import { createSignal, onMount, For, Index, useContext, onCleanup } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";

// SolidJS Types Imports
import type { JSX } from 'solid-js';

// SUID Imports
import { 
    IconButton, ButtonBase, Skeleton, Button,
    Select, MenuItem, FormControl, InputLabel
} from '@suid/material';



// SUID Icon Imports
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import SaveRoundedIcon from '@suid/icons-material/SaveRounded';


// Solid Toast
import toast from 'solid-toast';




// Component Imports
import PullRefresh from '@src/app/components/pull_refresh';


// Style Imports
import styles from "../styles/watch.module.css"
import "../styles/watch.css"
import "../styles/modify_player.css"


// Script Imports
import { ContextManager } from '@src/app/components/app';
import MODIFY_PLOADER from '../scripts/modify_ploader';
import MODIFY_FLOADER from '../scripts/modify_floader';
import { 
    get_episode_list, get_episode_server, get_server,
    get_watch_state, save_watch_state,
    request_get_local_download_manifest


} from '../scripts/watch';

// Type Imports
import { EpisodeList } from '../types/episode_list_type';
import { ServerData } from '../types/server_type';
import { EpisodeServerData } from '../types/episode_server_type';
import { WatchState } from '../types/watch_state';

// Vidstack Imports
import 'vidstack/bundle';
import { MediaPlayerElement } from 'vidstack/elements';
import {
    isHLSProvider,
    type MediaProviderChangeEvent,
    TextTrack
} from 'vidstack';

// HLS Imports
import Hls from 'hls.js';



export default function Watch() {
    const navigate = useNavigate();
    const [queryParams] = useSearchParams();
    const context = useContext(ContextManager);

    const source:string = queryParams.source as string ?? "";
    const id:string = queryParams.id as string ?? "";
    const link_plugin_id:string = queryParams.link_plugin_id as string ?? "";
    const link_id:string = queryParams.link_id as string ?? ""; 
    const season_index:number = parseInt(queryParams.season_index as string) ?? 0;
    const episode_index:number = parseInt(queryParams.episode_index as string) ?? 0;

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();
    

    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [is_loading_server, set_is_loading_server] = createSignal<boolean>(true);

    const [EPISODE_LIST, SET_EPISODE_LIST] = createSignal<EpisodeList[][][]>();
    
    const [EPISIDE_SERVER_DATA, SET_EPISODE_SERVER_DATA] = createSignal<EpisodeServerData>();
    const [SERVER_DATA, SET_SERVER_DATA] = createSignal<ServerData>();



    const [search, set_search] = createSignal<string>("");
    const [selected_server_id, set_selected_server_id] = createSignal<string>("");
    const [current_episode_page_index, set_current_episode_page_index] = createSignal<number>(0);

    const [current_season_index, set_current_season_index] = createSignal<number>(season_index);
    const [current_episode_index, set_current_episode_index] = createSignal<number>(episode_index);

    const [current_episode_id, set_current_episode_id] = createSignal<string>("");
    
    
    
    let current_watch_time:number = 0;

    const load_episode_list = async () => {
        const data = await get_episode_list(source, link_plugin_id, link_id);
        console.log("Episode List: ", data);
        SET_EPISODE_LIST(data);


        for (const [season_index, season] of data.entries()){
            if (season_index === current_season_index()){
                for (const [page_index, ep_page] of season.entries()){
                    for (const ep of ep_page){
                        if (ep.index === current_episode_index()){
                            set_current_episode_page_index(page_index);

                            set_current_season_index(season_index);
                            set_current_episode_index(ep.index);
                            set_current_episode_id(ep.id);
                            return;
                        }
                    }
                }
            }
        }
    }

    const load_episode_server = async () => {
        const data = await get_episode_server(
            source, id, link_plugin_id, 
            current_season_index(), 
            current_episode_index(),
            current_episode_id()
        );
        console.log("Episode Server: ", data);
        SET_EPISODE_SERVER_DATA(data);

        const prefer_server_type = localStorage.getItem("prefer_server_type");

        let selected_server_type:string;

        if (prefer_server_type && Object.keys(data).includes(prefer_server_type ?? "")){
            selected_server_type = prefer_server_type;
        }else{
            selected_server_type = Object.keys(data)[0];
        }

        const selected_server_id = data[selected_server_type]?.[0].id;
        if (selected_server_type && selected_server_id) {
            console.log("Selected Server ID: ", selected_server_id);
            localStorage.setItem("prefer_server_type", selected_server_type);

            set_selected_server_id(selected_server_id);
        }
    }

    const load_server = async () => {
        set_is_loading_server(true);
        const data = await get_server(source, link_plugin_id, selected_server_id());
        console.log("SERVER DATA: ", data);

        SET_SERVER_DATA(data);
        set_is_loading_server(false);
    }

    const get_data = async () => {
        set_is_loading(true);
        current_watch_time = 0;
        set_is_loading_server(true);
        try {
            await load_episode_list();
            await load_episode_server();

            load_server();

            set_is_loading(false);
        }catch(e){
            console.error(e);
            toast.remove();
            toast.error("Something went wrong.",{
                style: {
                    color:"red",
                }
            })
        }
    }

    
    onMount(() => {
        console.log(source, link_plugin_id, link_id, season_index, episode_index);
        get_data();
    })

    onMount(() => {
        let save_watch_state_interval: ReturnType<typeof setInterval> | undefined;

        save_watch_state_interval = setInterval(() => {
            if (current_watch_time > 0 && !is_loading()){
                save_watch_state(source, id, current_season_index(), current_episode_index(), {
                    current_time: current_watch_time
                })
                    .catch((e) => {
                        console.error(e);
                        toast.remove();
                        toast.error("Something went wrong while saving watch state.",{
                            style: {
                                color:"red",
                            }
                        })
                        clearInterval(save_watch_state_interval);
                    });
            }
        },1000);
        

        onCleanup(() => {
            clearInterval(save_watch_state_interval);
        })
    })

    const onProviderChange = async (e: MediaProviderChangeEvent) => {
        if (!CONTAINER_REF()) return;

        let provider = e.target.provider;
        if (isHLSProvider(provider) && Hls.isSupported()) {
            provider.library = Hls;
            
            provider.config = {
                // Apply loader for loading fragments/segments.
                fLoader: MODIFY_FLOADER({
                    host: SERVER_DATA()?.config.host,
                    origin: SERVER_DATA()?.config.origin,
                    referer: SERVER_DATA()?.config.referer
                }),
                // Apply loader for loading playlists.
                pLoader: MODIFY_PLOADER({
                    host: SERVER_DATA()?.config.host,
                    origin: SERVER_DATA()?.config.origin,
                    referer: SERVER_DATA()?.config.referer
                })
            };
        }

        const player = e.currentTarget as MediaPlayerElement;

        if (player) {
            /* Apply Timeline */
            const track = new TextTrack({
                kind: 'chapters',
                label: 'Chapters',
                language: 'en',
                type: 'vtt',
            });

            track.mode = 'showing'; 

            if (SERVER_DATA()?.data.intro){
                track.addCue(new VTTCue(SERVER_DATA()?.data.intro?.start ?? 0, SERVER_DATA()?.data.intro?.end ?? 0, 'Intro'));
            }
            
            if (SERVER_DATA()?.data.outro){
                track.addCue(new VTTCue(SERVER_DATA()?.data.outro?.start ?? 0, SERVER_DATA()?.data.outro?.end ?? 0, 'Outro'));
            }

            player.textTracks.add(track);
            /* --- */
        }
    };
    
    return (<>
        {(CONTAINER_REF() && (context?.screen_size?.()?.width ?? 0) <= 550) &&
            <PullRefresh container={CONTAINER_REF() as HTMLElement}
                onRefresh={()=> {
                    get_data();
                }}
            />
        }
        <div class={styles.container} ref={SET_CONTAINER_REF}>
            <div class={styles.header_container}>
                <IconButton
                    sx={{
                        color: "var(--color-1)",
                        fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                    }}
                    onClick={() => {
                        navigate(-1);
                    }}
                >
                    <ArrowBackRoundedIcon color='inherit' fontSize='inherit' />
                </IconButton>
            </div>
            

            {!is_loading() 
                ? <>
                    <div class={styles.container_1}>
                        <div class={styles.player_box}>
                            {!is_loading_server() 
                                ? <media-player
                                    id="player"
                                    playsInline webkit-playsinline crossOrigin autoPlay
                                    fullscreenOrientation='landscape'
                                    onfullscreenchange={(e) => {console.log(e)}}
                                    streamType='on-demand'
                                    style={{ 
                                        "border-radius": '0',
                                    }}
                                    on:loaded-data={async (e) => {
                                        const player = e.target;
                                        player.volume = parseFloat(localStorage.getItem("volume") || "1") || 1;
                                        let watch_state: WatchState | undefined;
                                        try{
                                            watch_state = await get_watch_state(
                                                source,
                                                id,
                                                current_season_index(),
                                                current_episode_index()
                                            );
                                        }catch(e){
                                            console.error(e);
                                            toast.remove();
                                            toast.error("Something went wrong while getting watch state.",{
                                                style: {
                                                    color:"red",
                                                }
                                            })
                                        }
                                        current_watch_time = watch_state?.current_time || 0
                                        player.currentTime = current_watch_time;
                                    }}
                                    volume={parseFloat(localStorage.getItem("volume") || "1") || 1}
                                    on:time-update={(e)=>{
                                        if (is_loading()) return;
                                        current_watch_time = e.detail.currentTime;
                                    }}
                                    on:volume-change={(e) => {
                                        if (is_loading()) return;
                                        localStorage.setItem("volume", e.detail.volume.toString());
                                    }}
                                    src={{
                                        src:SERVER_DATA()?.data.sources.find((item) => item.type === 'hls')?.file ?? "", 
                                        type:"application/x-mpegurl"
                                    }}
                                    on:provider-change={onProviderChange}
                                    on:text-track-change={(e)=>{
                                        if (is_loading()) return;
                                        console.log(e)
                                        localStorage.setItem("prefer_caption", (e?.detail?.label ?? "").toLowerCase());
                                    }}
                                    
                                >
                                    <media-provider>
                                        <For each={SERVER_DATA()?.data.tracks}>{(item) => 
                                            <track
                                                src={item.file}
                                                kind={item.kind as JSX.TrackHTMLAttributes<HTMLTrackElement>['kind']}
                                                label={item.label}
                                                default={localStorage.getItem("prefer_caption") === item.label?.toLowerCase()}
                                            />
                                        }</For>
                                    </media-provider>
                                    <media-video-layout
                                        
                                        thumbnails={SERVER_DATA()?.data.tracks.find((item) => item.kind === 'thumbnail')?.file}
                                    >
                                        <media-time-slider/>
                                    </media-video-layout>
                                </media-player>
                                : <div>
                                    <Skeleton variant='rectangular'
                                        sx={{
                                            width: "100%",
                                            height: "calc((100vw + 100vh)/2*0.45)",
                                            background: "var(--background-2)",
                                        }}
                                    
                                    />
                                </div>
                            }
                        </div>
                        <div class={styles.tool_box}>
                            <div class={styles.server_container}>
                                <For each={Object.keys(EPISIDE_SERVER_DATA() || {})}>
                                    {(server_type)=>(
                                        <div class={styles.server_box}>
                                            <span class={styles.server_label}>{server_type.toUpperCase()}:</span>
                                            <div class={`${styles.server_item_box} ${["android","ios" ].includes(platform()) && "hide_scrollbar"}`}
                                                onWheel={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.scrollBy({
                                                        left: e.deltaY,
                                                        behavior: "smooth",
                                                    });
                                                }}
                                            >
                                                <For each={EPISIDE_SERVER_DATA()?.[server_type]}>
                                                    {(server_item)=>(
                                                        <Button  color='primary'
                                                            variant={selected_server_id() === server_item.id ? 'contained' : 'outlined'}
                                                            sx={{
                                                                color: "var(--color-1)",
                                                                fontSize: "calc((100vw + 100vh)/2*0.015)",
                                                                minWidth: 0,
                                                                width: "fit-content",
                                                                margin:0,
                                                                padding: "8px 12px",
                                                            }}
                                                            onClick={() => {
                                                                localStorage.setItem("prefer_server_type", server_type);
                                                                set_selected_server_id(server_item.id);
                                                                load_server();
                                                            }}
                                                        >
                                                            {server_item.title.toUpperCase()}
                                                        </Button>
                                                    )}
                                                </For>
                                                
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>
                    </div>
                    
                    
                    <div class={styles.episode_container}>
                        <div class={styles.episode_header_box}>
                            <div
                                style={{
                                    flex:1,
                                    display: 'flex',
                                    "flex-direction": 'row',
                                    gap: '8px',
                                }}
                            >
                                {((EPISODE_LIST()?.length ?? 0) > 1) && 
                                    <div
                                        style={{
                                            flex:1,
                                        }}
                                    >
                                    
                                        <FormControl fullWidth>
                                            <InputLabel id="season_label"
                                                sx={{
                                                    color: 'var(--color-1)',
                                                    fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                                    fontWeight: '500',
                                                    userSelect: 'none',
                                                }}
                                            >Season</InputLabel>
                                            <Select
                                                labelId="season_label"
                                                value={current_season_index()}
                                                label="Season"
                                                onChange={(e)=>{
                                                    const value = e.target.value;
                                                    set_current_season_index(value);
                                                }}  
                                                sx={{
                                                    color: 'var(--color-1)',
                                                    fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                                    fontWeight: '500',
                                                    background: 'var(--background-2)',
                                                    "& .MuiSvgIcon-root": {
                                                        color: "var(--color-1)"
                                                    }
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            color: 'var(--color-1)',
                                                            background: 'var(--background-3)',
                                                            fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                                            maxHeight: "calc((100vw + 100vh)/2*0.4)",
                                                        },
                                                    },
                                                }}

                                            >
                                                <For each={[...Array(EPISODE_LIST()?.length ?? 0)]}>
                                                    {(_, index) =>(
                                                        <MenuItem value={index()}
                                                            sx={{
                                                                fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                                            }}
                                                        >Season: {index()+1}</MenuItem>
                                                    )}
                                                </For>
                                            </Select>
                                        </FormControl>
                                    
                                    </div>
                                }
                                {((EPISODE_LIST()?.[current_season_index()]?.length ?? 0) > 1) && 
                                    <div
                                        style={{
                                            flex:1,
                                        }}
                                    >
                                        <FormControl fullWidth>
                                            <InputLabel id="episode_page_label"
                                                sx={{
                                                    color: 'var(--color-1)',
                                                    fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                                    fontWeight: '500',
                                                    userSelect: 'none',
                                                }}
                                            >Episode page</InputLabel>
                                            <Select
                                                labelId="episode_page_label"
                                                value={current_episode_page_index()}
                                                label="Episode page"
                                                onChange={(e)=>{
                                                    const value = e.target.value;
                                                    set_current_episode_page_index(parseInt(value));
                                                }}
                                                sx={{
                                                    color: 'var(--color-1)',
                                                    fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                                    fontWeight: '500',
                                                    background: 'var(--background-2)',
                                                    "& .MuiSvgIcon-root": {
                                                        color: "var(--color-1)"
                                                    }
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            color: 'var(--color-1)',
                                                            background: 'var(--background-3)',
                                                            maxHeight: "calc((100vw + 100vh)/2*0.4)",
                                                        },
                                                    },
                                                }}

                                            >
                                                <For each={[...Array(EPISODE_LIST()?.[current_season_index()]?.length ?? 0)]}>
                                                    {(_, index) =>(
                                                        <MenuItem value={index()}
                                                            sx={{
                                                                fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                                            }}
                                                        >Episode page: {index()+1}</MenuItem>
                                                    )}
                                                </For>
                                            </Select>
                                        </FormControl>
                                    </div>
                                }
                            </div>

                            <div class={styles.search_container}> 
                                <ButtonBase
                                    sx={{
                                        color: 'var(--color-1)',
                                        fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                        minHeight: "100%",
                                        borderTopRightRadius: "16px",
                                        borderBottomRightRadius: "16px",
                                    }}
                                    type='submit'
                                    disabled={true}
                                >
                                    <SearchRoundedIcon color="inherit" fontSize='inherit' />
                                </ButtonBase>
                                
                                <input class={styles.search_input} type='text' placeholder='Search'
                                    value={search()}
                                    onInput={(e) => {
                                        const value = e.currentTarget.value;
                                        set_search(value);
                                    }}
                                /> 
                                
                                
                                
                            </div>
                        </div>
                        <div class={`${styles.episode_body_box} ${["android","ios" ].includes(platform()) && "hide_scrollbar"}`}>
                            <For each={EPISODE_LIST()?.[current_season_index()]?.[current_episode_page_index()].filter(
                                (item) => search() === "" || item.index.toString().includes(search().trim()) 
                                    || item.id.includes(search().trim()) || item.title.toLowerCase().includes(search().trim().toLowerCase())
                            )}>
                                {(item)=>{
                                    const [available_local, set_available_local] = createSignal(false);

                                    onMount(() => {
                                        request_get_local_download_manifest(source,id,current_season_index(),item.index)
                                            .then((data) => {
                                                console.log("Local Download Manifest: ", data);
                                                if (data !== null) {
                                                    set_available_local(true);
                                                }
                                            })
                                            .catch((e) => {
                                                console.error(e);
                                            })
                                    })

                                    return (<div class={styles.episode_item_box}>
                                        <ButtonBase
                                            sx={{
                                                flex:1,
                                                color: 'var(--color-1)',
                                                fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                                fontWeight: '500',
                                                padding: '8px',
                                                justifyContent: 'flex-start',
                                                background: 'var(--background-2)',
                                                textAlign: 'left',
                                                boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
                                                ...((item.id === current_episode_id()) && {
                                                    background: 'var(--background-3)',
                                                    color: 'gray',
                                                }),
                                                "&:hover": {
                                                    background: 'var(--background-3)',
                                                }
                                            }}
                                            onClick={() => {
                                                set_current_episode_id(item.id);
                                                set_current_episode_index(item.index);
                                                get_data();
                                            }}
                                        >
                                            Episode {item.index+1}: {item.title}
                                        </ButtonBase>
                                        {available_local() &&
                                            <SaveRoundedIcon
                                                sx={{
                                                    color: "cyan",
                                                    fontSize: 'calc((100vw + 100vh)/2*0.0325)',
                                                }}
                                            />
                                        }
                                    </div>)
                                }}
                            </For>
                        </div>
                    </div>
                </>
                
                :  <> {/* Loading Skeleton */}
                    <div
                        style={{
                            width: "100%",
                            height: "auto",
                            display: "flex",
                            "flex-direction": "column",
                            overflow: "hidden",
                        }}
                    >
                        <div class={styles.container_1}>
                            <Skeleton variant='rectangular'
                                sx={{
                                    width: "100%",
                                    height: "calc((100vw + 100vh)/2*0.45)",
                                    background: "var(--background-2)",
                                }}
                            
                            />
                            <div class={styles.tool_box}>
                                <Skeleton variant='rectangular'
                                    sx={{
                                        width: "100%",
                                        height: "calc((100vw + 100vh)/2*0.05)",
                                        background: "var(--background-2)",
                                    }}
                                />
                                <Skeleton variant='rectangular'
                                    sx={{
                                        width: "100%",
                                        height: "calc((100vw + 100vh)/2*0.05)",
                                        background: "var(--background-2)",
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            style={{
                                width: "100%",
                                height: "auto",
                                display: "flex",
                                "flex-direction": "column",
                                gap: "5px"
                            }}
                        >
                            <div class={styles.episode_body_box}
                                style={{
                                    overflow: "hidden",
                                }}
                            >
                                <Index each={[...Array(10)]}>
                                    {(_) =>(
                                        <Skeleton variant='rectangular'
                                            sx={{
                                                width: "100%",
                                                minHeight: "calc((100vw + 100vh)/2*0.05)",
                                                background: "var(--background-2)",
                                            }}
                                        />
                                    )}
                                </Index>
                            </div>
                        </div>
                    </div>
                </>
            }

        </div>
    </>)
}

