// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Imports
import { createSignal, onMount, Index, For, useContext } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton } from '@suid/material';

// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import BookmarkAddOutlinedIcon from '@suid/icons-material/BookmarkAddOutlined';
import ExtensionRoundedIcon from '@suid/icons-material/ExtensionRounded';

// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import Swiper from "@src/app/components/swiper";
import LazyLoadImage from '@src/app/components/lazyloadimage';
import GridBox from '@src/app/components/grid_box';
import PullRefresh from '@src/app/components/pull_refresh';

// Style Imports
import styles from "../styles/manage_plugin.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';


interface VIEW_DATA {
    id: string,
    title: string,
    poster: string,
    banner: string,
    description: string,

    meta_data: string[],

    trailer?: {
        embed_url?: string,
        url?: string
    },

    // Required: Season -> Episodes Page -> Episodes
    episode_list?: {
        index: number,
        id: string,
        title: string
    }[][][],
}

export default function ManagePlugin() {
    const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [current_tab, set_current_tab] = createSignal(0);

    const [is_loading, set_is_loading] = createSignal<boolean>(true);

    const [DATA, SET_DATA] = createSignal<VIEW_DATA>();

    const [show_more, set_show_more] = createSignal(false);
    const [show_trailer, set_show_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});

    const get_data = () => {
        set_is_loading(true);
        // invoke<VIEW_DATA>('view', {source:"anime", id: "1"})
        //     .then((data) => {
        //         SET_DATA(data);
        //         console.table(data)
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
        <div class={styles.container}>
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
                <div class={`${styles.tab_container} ${["android","ios" ].includes(platform()) && "hide_scrollbar"}`}
                    onWheel={(e) => {
                        e.preventDefault();
                        e.currentTarget.scrollBy({
                            left: e.deltaY,
                            behavior: "smooth",
                        });
                    }}
                >
                    <For each={Tab}>
                        {(item, index) => (
                            <ButtonBase
                                sx={{
                                    color: "var(--color-1)",
                                    fontSize: "calc((100vw + 100vh)/2*0.0275)",
                                    whiteSpace: "nowrap",
                                    padding: "12px",
                                    fontWeight: "500",
                                    textTransform: "none",
                                    ...(current_tab() == index() 
                                        ? {
                                            background: "var(--background-3)",
                                        }
                                        : {
                                            "&:hover": {
                                                background: "var(--background-2)",
                                            }
                                        }
                                    ),
                                    
                                }}

                                onClick={() => {
                                    set_current_tab(index());
                                }}
                            >
                                {item}
                            </ButtonBase>
                        )}
                    </For>
                </div>
            </div>
        </div>
        
    </>)
}

const Tab = [
    "Link Plugins",
    "Add Plugins",
    "Installed Plugins"
]
