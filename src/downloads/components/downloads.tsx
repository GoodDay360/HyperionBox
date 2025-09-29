// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { platform } from '@tauri-apps/plugin-os';


// SolidJS Imports
import { createSignal, onMount, For, Index, useContext } from "solid-js";

// SolidJS Router Imports
import { useNavigate } from '@solidjs/router';


// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton, Slide, CircularProgress } from '@suid/material';


// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';
import ArrowRightRoundedIcon from '@suid/icons-material/ArrowRightRounded';


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
import { Content, ContentData, RelevantContent, HomeData } from '../types/downloads_type';



export default function Download() {
    const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();


    const [is_loading, set_is_loading] = createSignal<boolean>(false);
    const [search, set_search] = createSignal<string>("");
    const [search_mode, set_search_mode] = createSignal<boolean>(false);

    const [RELEVANT_DATA, SET_RELEVANT_DATA] = createSignal<RelevantContent[]>([]);
    const [CONTENT_DATA, SET_CONTENT_DATA] = createSignal<Content[]>([]);

    const [show_trailer, set_show_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});
    
    const get_data = () => {
        // set_is_loading(true);
        // invoke<HomeData>('home', {source:"anime"})
        //     .then((data) => {
        //         console.log(data)
        //         SET_RELEVANT_DATA(data.relevant_content);
        //         SET_CONTENT_DATA(data.content);

        //         console.table(RELEVANT_DATA())
        //         set_is_loading(false);
        //     })
        //     .catch((e) => {
        //         console.error(e);
        //         toast.remove();
        //         toast.error("Something went wrong.",{
        //             style: {
        //                 color:"red",
        //             }
        //         })
        //     });
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
            
            <div class={styles.body_contaienr}>
                <div class={styles.content_container}>
                    <For each={[...Array(2)]}>
                        {(_, index)=>(
                            
                            <div class={styles.item_container}>
                                <div class={styles.item_box_1}>
                                    <LazyLoadImage 
                                        className={styles.item_img}
                                        src={"https://cdn.myanimelist.net/r/320x440/images/anime/1697/151793.webp?s=e383acf2ad17237624b409f17f1ccbda"}
                                    />
                                    <div class={styles.info_box}>
                                        <span class={styles.item_title}>Solo Leveling</span>
                                    </div>
                                </div>

                                <div class={styles.item_box_2}>
                                    <div class={styles.item_content_box}>
                                        <span class={styles.item_season_text}>Season: 1</span>
                                        <div class={styles.item_episode_box}>
                                            <span class={styles.item_episode_text}><ArrowRightRoundedIcon color='inherit' fontSize='inherit'/>Episodes: 2</span>
                                            <CircularProgress color='secondary' variant='indeterminate'
                                                value={10}
                                                size={"calc((100vw + 100vh)/2*0.0325)"}        
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        )}
                    
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

