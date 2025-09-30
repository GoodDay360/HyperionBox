// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { platform } from '@tauri-apps/plugin-os';


// SolidJS Imports
import { createSignal, onMount, For, Index, useContext } from "solid-js";
import { createStore } from "solid-js/store"

// SolidJS Router Imports
import { useNavigate } from '@solidjs/router';


// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton, Slide, CircularProgress, LinearProgress, Box } from '@suid/material';


// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';
import ArrowRightRoundedIcon from '@suid/icons-material/ArrowRightRounded';
import CheckRoundedIcon from '@suid/icons-material/CheckRounded';


// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import Swiper from "@src/app/components/swiper";
import LazyLoadImage from '@src/app/components/lazyloadimage';
import PullRefresh from '@src/app/components/pull_refresh';


// Style Imports
import styles from "../styles/downloads.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';

// Types Import
import { request_get_download, request_set_pause_download, request_remove_download } from '../scripts/downloads';
import { GetDownload } from '../types/downloads_type';



export default function Download() {
    const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();


    const [is_loading, set_is_loading] = createSignal<boolean>(false);
    const [DOWNLOAD_DATA, SET_DOWNLOAD_DATA] = createStore<Record<string,GetDownload>>({});

    const get_data = () => {
        // set_is_loading(true);
        
    }

    onMount(() => {
        
        get_data();

        request_get_download()
            .then((data) => {
                console.log(data);
                SET_DOWNLOAD_DATA(data);
            })
            .catch((e) => {
                console.error(e);
                toast.remove();
                toast.error("Something went wrong.",{
                    style: {
                        color:"red",
                    }
                })
            })
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
            
            <div class={styles.body_contaienr}>
                <div class={styles.content_container}>
                    <For each={Object.keys(DOWNLOAD_DATA)}>
                        {(id)=> {
                            const max:number = DOWNLOAD_DATA[id].max;

                            const [finished, set_finished] = createSignal<number>(DOWNLOAD_DATA[id].finished);
                            const [pause, set_pause] = createSignal<boolean>(DOWNLOAD_DATA[id].pause);

                            const [is_working, set_is_working] = createSignal(false);

                            return (
                                <div class={styles.item_container}>
                                    <div class={styles.item_box_1}>
                                        <ButtonBase
                                            sx={{
                                                width: 'calc((100vw + 100vh)/2 * 0.18)',
                                                height: 'calc((100vw + 100vh)/2 * 0.25)',
                                                borderTopLeftRadius: '5px',
                                                borderBottomLeftRadius: '5px',
                                            }}
                                        >
                                            <LazyLoadImage 
                                                className={styles.item_img}
                                                src={DOWNLOAD_DATA[id].poster}
                                            />
                                        </ButtonBase>
                                        <div class={styles.info_box}>
                                            <span class={styles.item_title}>{DOWNLOAD_DATA[id].title}</span>
                                            <Box sx={{ width: "100%" }}>
                                                <LinearProgress variant="determinate" value={100*finished()/max} />
                                            </Box>
                                        </div>
                                    </div>

                                    <div class={styles.item_box_2}>
                                        <div class={styles.item_content_box}>
                                            <For each={Object.keys(DOWNLOAD_DATA[id].seasons).map(Number)}>
                                                {(season_index) => (<>
                                                    {((Object.keys(DOWNLOAD_DATA[id].seasons).length > 1) || (season_index !== 0)) &&
                                                        <span class={styles.item_season_text}>Season: {season_index+1}</span>
                                                    }
                                                    <For each={Object.keys(DOWNLOAD_DATA[id].seasons[season_index]).map(Number)}>
                                                        {(episode_index) => (
                                                            <div class={styles.item_episode_box}>
                                                                <span class={styles.item_episode_text}><ArrowRightRoundedIcon color='inherit' fontSize='inherit'/>Episodes: {episode_index+1}</span>
                                                                {DOWNLOAD_DATA[id].seasons[season_index][episode_index].done
                                                                    ? <CheckRoundedIcon color='success'
                                                                        sx={{
                                                                            fontSize: 'calc((100vw + 100vh)/2*0.0325)',
                                                                        }}
                                                                    />
                                                                    : <CircularProgress color='secondary' variant='determinate'
                                                                        value={10}
                                                                        size={"calc((100vw + 100vh)/2*0.0325)"}        
                                                                    />
                                                                }
                                                                
                                                            </div>
                                                        )}
                                                    </For>
                                                </>)}
                                                
                                            </For>
                                        </div>
                                    </div>
                                    <div class={styles.item_button_box}>
                                        <Button variant='outlined' color='secondary' disabled={is_working()}
                                            sx={{
                                                fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                                textTransform: 'none',
                                            }}
                                            onClick={() => {
                                                set_is_working(true);
                                                request_set_pause_download(
                                                    DOWNLOAD_DATA[id].source,
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

                                        <Button variant='outlined' color='error' disabled={is_working()}
                                            sx={{
                                                fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                                textTransform: 'none',
                                            }}
                                            onClick={() => {
                                                set_is_working(true);
                                                request_remove_download(
                                                    DOWNLOAD_DATA[id].source,
                                                    id
                                                )
                                                    .then(() => {
                                                        SET_DOWNLOAD_DATA({...DOWNLOAD_DATA, [id]: undefined});
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
                                            Cancel
                                        </Button>

                                    </div>
                                </div>
                            )
                        }}
                    
                    </For>
                </div>
            </div>

        </div>


        {/* Navigation Bar For Small Screen Width */}
        {(context?.screen_size?.()?.width ?? 0) <= 550 &&
            <NavigationBar type='bottom'/>
        }
    </>)
}

