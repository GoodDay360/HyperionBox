// Tauri API
import { listen } from '@tauri-apps/api/event';


// SolidJS Imports
import { createSignal, onMount, For, Index, useContext, onCleanup } from "solid-js";

// SolidJS Router Imports
import { useNavigate } from '@solidjs/router';


// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton, CircularProgress, LinearProgress, Box } from '@suid/material';


// SUID Icon Imports
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';
import ArrowRightRoundedIcon from '@suid/icons-material/ArrowRightRounded';
import CheckRoundedIcon from '@suid/icons-material/CheckRounded';
import ReplayRoundedIcon from '@suid/icons-material/ReplayRounded';
import RemoveCircleOutlineRoundedIcon from '@suid/icons-material/RemoveCircleOutlineRounded';


// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import LazyLoadImage from '@src/app/components/lazyloadimage';
import PullRefresh from '@src/app/components/pull_refresh';


// Style Imports
import styles from "../styles/downloads.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';

// Types Import
import { 
    request_get_download, 
    request_set_pause_download, request_set_error_download, 
    request_remove_download, request_remove_download_item,
    request_get_current_download_status 
} from '../scripts/downloads';
import { GetDownload, CurrentDownloadStatus } from '../types/downloads_type';



export default function Downloads() {
    const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();


    const [is_loading, set_is_loading] = createSignal<boolean>(false);
    const [DOWNLOAD_DATA, SET_DOWNLOAD_DATA] = createSignal<Record<string,GetDownload>>({});
    const [CURRENT_DOWNLOAD_STATUS, SET_CURRENT_DOWNLOAD_STATUS] = createSignal<CurrentDownloadStatus|null>(null);

    const get_data = () => {
        set_is_loading(true);
        SET_DOWNLOAD_DATA({});
        SET_CURRENT_DOWNLOAD_STATUS(null);

        request_get_download()
            .then((data) => {
                console.log(data);
                SET_DOWNLOAD_DATA(data);
                set_is_loading(false)
            })
            .catch((e) => {
                console.error(e);
                toast.remove();
                toast.error("Something went wrong while getting downloads.",{
                    style: {
                        color:"red",
                    }
                })
            })
        
        request_get_current_download_status()
            .then((data) => {
                console.log(data);
                SET_CURRENT_DOWNLOAD_STATUS(data);
            })
            .catch((e) => {
                console.error(e);
                toast.remove();
                toast.error("Something went wrong while getting current download status.",{
                    style: {
                        color:"red",
                    }
                })
            })
    }

    onMount(() => {
        
        get_data();

        
    })
    
    return (<>
        {(CONTAINER_REF() && (context?.screen_size?.()?.width ?? 0) <= 550) &&
            <PullRefresh container={CONTAINER_REF() as HTMLElement}
                onRefresh={get_data}
            />
        }
        <div class={styles.container} ref={SET_CONTAINER_REF}>
            {(context?.screen_size?.()?.width ?? 0) > 550 &&
                <div class={styles.header_container}>
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            "flex-direction": "row",
                            "justify-content": "center",
                        }}
                    >
                        <div
                            style={{
                                width: "auto",
                                height: "auto",
                            }}
                        >
                            <NavigationBar type="top" />
                        </div>
                    </div>
                    
                    <IconButton disabled={is_loading()}
                        sx={{
                            color: 'var(--color-1)',
                            fontSize: 'calc((100vw + 100vh)/2*0.035)'
                        }}
                        onClick={() => {
                            get_data();
                        }}
                    >
                        <RefreshRoundedIcon color="inherit" fontSize='inherit' />
                            
                    </IconButton>
                </div>
            }
            
            <div class={styles.body_container}>
                {!is_loading()
                    ? <div class={styles.content_container}>
                        <For each={Object.keys(DOWNLOAD_DATA()).sort((a, b) => {
                            if (
                                DOWNLOAD_DATA()[a].source === CURRENT_DOWNLOAD_STATUS()?.source &&
                                DOWNLOAD_DATA()[a].id === CURRENT_DOWNLOAD_STATUS()?.id
                            ) return -1;
                            if (
                                DOWNLOAD_DATA()[b].source === CURRENT_DOWNLOAD_STATUS()?.source &&
                                DOWNLOAD_DATA()[b].id === CURRENT_DOWNLOAD_STATUS()?.id
                            ) return 1;
                            return 0;
                        })}>
                            {(id)=> {
                                const max:number = DOWNLOAD_DATA()[id].max;
                                const source:string = DOWNLOAD_DATA()[id].source;

                                const [finished, set_finished] = createSignal<number>(DOWNLOAD_DATA()[id].finished);
                                const [pause, set_pause] = createSignal<boolean>(DOWNLOAD_DATA()[id].pause);

                                const [is_working, set_is_working] = createSignal(false);

                                return (
                                    <div class={styles.item_container}>
                                        <div class={styles.item_box_1}>
                                            <ButtonBase
                                                sx={{
                                                    width: 'calc((100vw + 100vh)/2 * 0.18)',
                                                    height: 'calc((100vw + 100vh)/2 * 0.25)',
                                                    borderTopLeftRadius: '5px',
                                                }}
                                                onClick={() => {
                                                    navigate(`/view/?source=${source}&id=${id}`);
                                                }}
                                            >
                                                <LazyLoadImage 
                                                    className={styles.item_img}
                                                    src={DOWNLOAD_DATA()[id].poster}
                                                />
                                            </ButtonBase>
                                            <div class={styles.info_box}>
                                                <span class={styles.item_title}>{DOWNLOAD_DATA()[id].title}</span>
                                                <Box sx={{ width: "100%" }}>
                                                    <LinearProgress variant="determinate" value={100*finished()/max} />
                                                </Box>
                                            </div>
                                        </div>

                                        <div class={styles.item_box_2}>
                                            <div class={styles.item_content_box}>
                                                <For each={Object.keys(DOWNLOAD_DATA()[id].seasons).map(Number)}>
                                                    {(season_index) => (<>
                                                        {((Object.keys(DOWNLOAD_DATA()[id].seasons).length > 1) || (season_index !== 0)) &&
                                                            <span class={styles.item_season_text}>Season: {season_index+1}</span>
                                                        }
                                                        <For each={Object.keys(DOWNLOAD_DATA()[id].seasons[season_index]).map(Number)}>
                                                            {(episode_index) => {
                                                                const source = DOWNLOAD_DATA()[id].source;
                                                                
                                                                const [is_done, set_is_done] = createSignal<boolean>(DOWNLOAD_DATA()[id].seasons[season_index][episode_index]?.done);
                                                                const [is_error, set_is_error] = createSignal<boolean>(DOWNLOAD_DATA()[id].seasons[season_index][episode_index]?.error);

                                                                const [current_progress, set_current_progress] = createSignal(0);

                                                                onMount(() => {
                                                                    let unlisten: () => void;
                                                                    (async () => {
                                                                        unlisten = await listen<CurrentDownloadStatus>(`download-status-${source}-${id}-${season_index}-${episode_index}`, (event) => {
                                                                            const current_status =  event.payload;

                                                                            set_current_progress(current_status.current/current_status.total*100);

                                                                            SET_CURRENT_DOWNLOAD_STATUS({
                                                                                source,
                                                                                id,
                                                                                season_index,
                                                                                episode_index,
                                                                                current: current_status.current,
                                                                                total: current_status.total
                                                                            })
                                                                        });
                                                                    })();
                                                                    onCleanup(() => {
                                                                        unlisten(); 
                                                                    });
                                                                })

                                                                onMount(() => {
                                                                    let unlisten: () => void;
                                                                    (async () => {
                                                                        unlisten = await listen<boolean>(`download-finish-${source}-${id}-${season_index}-${episode_index}`, (event) => {
                                                                            const done =  event.payload;
                                                                            set_is_done(done);
                                                                            set_finished(finished()+1);
                                                                        });
                                                                    })();
                                                                    onCleanup(() => {
                                                                        unlisten(); 
                                                                    });
                                                                })

                                                                onMount(() => {
                                                                    let unlisten: () => void;
                                                                    (async () => {
                                                                        unlisten = await listen<boolean>(`download-error-${source}-${id}-${season_index}-${episode_index}`, (event) => {
                                                                            const error =  event.payload;
                                                                            set_is_error(error);
                                                                        });
                                                                    })();
                                                                    onCleanup(() => {
                                                                        unlisten(); 
                                                                    });
                                                                })

                                                                return (
                                                                    <div class={styles.item_episode_box}>
                                                                        
                                                                        <span class={styles.item_episode_text}><ArrowRightRoundedIcon color='inherit' fontSize='inherit'/>Episodes: {episode_index+1}</span>
                                                                        
                                                                        {!is_error()
                                                                            ? <>
                                                                                {is_done()
                                                                                    ? <CheckRoundedIcon color='success'
                                                                                        sx={{
                                                                                            fontSize: 'calc((100vw + 100vh)/2*0.0325)',
                                                                                        }}
                                                                                    />
                                                                                    : <CircularProgress color='secondary' variant='determinate'
                                                                                        value={current_progress()}
                                                                                        size={"calc((100vw + 100vh)/2*0.0325)"}        
                                                                                    />
                                                                                }
                                                                            </>
                                                                            : <>
                                                                                <IconButton
                                                                                    sx={{
                                                                                        color: "cyan",
                                                                                        fontSize: 'calc((100vw + 100vh)/2*0.0325)',
                                                                                    }}
                                                                                    onClick={() => {
                                                                                        request_set_error_download(
                                                                                            source, id, season_index, episode_index, false
                                                                                        )
                                                                                            .then(() => {
                                                                                                set_is_error(false);
                                                                                                toast.remove();
                                                                                                toast.success("Request retry successful.",{
                                                                                                    style: {
                                                                                                        color:"green",
                                                                                                    }
                                                                                                })
                                                                                            })
                                                                                            .catch((error) => {
                                                                                                console.error(error);
                                                                                                toast.remove();
                                                                                                toast.error("Something went wrong while requesting retry.",{
                                                                                                    style: {
                                                                                                        color:"red",
                                                                                                    }
                                                                                                })
                                                                                            });
                                                                                    }}
                                                                                >
                                                                                    <ReplayRoundedIcon/>
                                                                                </IconButton>
                                                                            </>
                                                                        }

                                                                        {(is_error() || is_done()) &&
                                                                            <IconButton
                                                                                sx={{
                                                                                    color: "red",
                                                                                    fontSize: 'calc((100vw + 100vh)/2*0.0325)',
                                                                                }}
                                                                                onClick={() => {
                                                                                    request_remove_download_item(
                                                                                        source, id, season_index, episode_index
                                                                                    )
                                                                                        .then(() => {
                                                                                            get_data();
                                                                                            toast.remove();
                                                                                            toast.success("Episode removed successfully.",{
                                                                                                style: {
                                                                                                    color:"green",
                                                                                                }
                                                                                            })
                                                                                        })
                                                                                        .catch((error) => {
                                                                                            console.error(error);
                                                                                            toast.remove();
                                                                                            toast.error("Something went wrong while removing episode.",{
                                                                                                style: {
                                                                                                    color:"red",
                                                                                                }
                                                                                            })
                                                                                        });
                                                                                }}
                                                                            >
                                                                                <RemoveCircleOutlineRoundedIcon/>
                                                                            </IconButton>
                                                                        }
                                                                        
                                                                    </div>
                                                                )
                                                            }}
                                                        </For>
                                                    </>)}
                                                    
                                                </For>
                                            </div>
                                        </div>
                                        <div class={styles.item_button_box}>
                                            {max !== finished() && 
                                                <Button variant='outlined' color='secondary' disabled={is_working()}
                                                    sx={{
                                                        fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                                        textTransform: 'none',
                                                    }}
                                                    onClick={() => {
                                                        set_is_working(true);
                                                        request_set_pause_download(
                                                            DOWNLOAD_DATA()[id].source,
                                                            id,
                                                            !pause()
                                                        )
                                                            .then(() => {
                                                                set_pause(!pause());
                                                            })
                                                            .catch((error) => {
                                                                console.error(error);
                                                                toast.remove();
                                                                toast.error("Something went wrong while requesting pause.",{
                                                                    style: {
                                                                        color:"red",
                                                                    }
                                                                })
                                                            })
                                                            .finally(() => {
                                                                set_is_working(false);
                                                            });
                                                    }}
                                                >
                                                    {pause() == true ? "Resume" : "Pause"}
                                                </Button>
                                            }

                                            <Button variant='outlined' color='error' disabled={is_working()}
                                                sx={{
                                                    fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                                    textTransform: 'none',
                                                }}
                                                onClick={() => {
                                                    set_is_working(true);
                                                    request_remove_download(
                                                        DOWNLOAD_DATA()[id].source,
                                                        id
                                                    )
                                                        .then(() => {
                                                            get_data();
                                                            toast.remove();
                                                            toast.success("Download removed successfully.",{
                                                                style: {
                                                                    color:"green",
                                                                }
                                                            })
                                                        })
                                                        .catch((error) => {
                                                            console.error(error);
                                                            toast.remove();
                                                            toast.error("Something went wrong while removing download.",{
                                                                style: {
                                                                    color:"red",
                                                                }
                                                            })
                                                        })
                                                        .finally(() => {
                                                            set_is_working(false);
                                                        });
                                                }}
                                            >
                                                {max == finished() ? "Remove" : "Cancel"}
                                            </Button>

                                        </div>
                                    </div>
                                )
                            }}
                        </For>
                        {(Object.keys(DOWNLOAD_DATA()).length === 0) &&
                            <div class={styles.feedback_box}>
                                <span class={styles.feedback_text}>No downloads.</span>
                            </div>
                        }
                    </div>
                    : <div
                        style={{
                            width: '100%',
                            height:"auto",
                            display: "flex",
                            "flex-direction": "column",
                            gap: "12px",
                            padding: "12px",
                        }}
                    >
                        <Index each={[...Array(10)]}> 
                            {(_)=>(
                                <Skeleton variant='rectangular'
                                    sx={{
                                        width: '100%',
                                        height: 'calc((100vw + 100vh)/2 * 0.45)',
                                        borderRadius: '5px',
                                        background: 'var(--background-2)',
                                    }}
                                />
                            )}
                        </Index>
                    </div>
                }
            </div>

        </div>


        {/* Navigation Bar For Small Screen Width */}
        {(context?.screen_size?.()?.width ?? 0) <= 550 &&
            <NavigationBar type='bottom'/>
        }
    </>)
}

