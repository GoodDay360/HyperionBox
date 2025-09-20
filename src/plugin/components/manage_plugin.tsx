// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Imports
import { createSignal, onMount, Index, For, useContext, onCleanup, createEffect, on } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton, CircularProgress } from '@suid/material';

// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import BookmarkAddOutlinedIcon from '@suid/icons-material/BookmarkAddOutlined';
import ExtensionRoundedIcon from '@suid/icons-material/ExtensionRounded';
import FileDownloadRoundedIcon from '@suid/icons-material/FileDownloadRounded';
import DownloadDoneRoundedIcon from '@suid/icons-material/DownloadDoneRounded';
import RemoveDoneRoundedIcon from '@suid/icons-material/RemoveDoneRounded';
import RemoveCircleOutlineRoundedIcon from '@suid/icons-material/RemoveCircleOutlineRounded';
import UpgradeRoundedIcon from '@suid/icons-material/UpgradeRounded';

// Solid Toast
import toast from 'solid-toast';

// Semver Imports
import semver from 'semver';

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
import { get_plugin_list, install_plugin, get_installed_plugin_list, remove_plugin, get_plugin_release } from '../scripts/manage_plugin';

// Script Type Imports
import { PluginList, InstalledPluginList } from '../types/manage_plugin';

export default function ManagePlugin() {
    const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [current_tab, set_current_tab] = createSignal(1);

    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [is_working, set_is_working] = createSignal<boolean>(false);
    const [PLUGIN_LIST, SET_PLUGIN_LIST] = createSignal<Record<string, PluginList>>({});
    const [INSTALLED_PLUGIN_LIST, SET_INSTALLED_PLUGIN_LIST] = createSignal<Record<string, InstalledPluginList>>({});
    const [show_more, set_show_more] = createSignal(false);
    const [show_trailer, set_show_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});


    onMount(() => {
        get_plugin_list("anime")
            .then((data) => {    
                SET_PLUGIN_LIST(data);
            })

        
    })

    createEffect(on(current_tab, () => {
        get_installed_plugin_list("anime")
            .then((data) => {    
                console.log(data);
                SET_INSTALLED_PLUGIN_LIST(data);
            })
        
    }))


    return (<>
        <div class={styles.container}>
            <div class={styles.header_container}>
                <IconButton disabled={is_working()}
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
                            <ButtonBase disabled={is_working()}
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

            {current_tab() === 1 && (
                <div class={styles.add_plugin_container}>
                    {Object.keys(PLUGIN_LIST()).filter((plugin_id)=>{return !INSTALLED_PLUGIN_LIST()[plugin_id]}).length > 0 
                        ? <For each={Object.keys(PLUGIN_LIST()).filter((plugin_id)=>{return !INSTALLED_PLUGIN_LIST()[plugin_id]})}>
                            {(plugin_id)=>{
                                let title = PLUGIN_LIST()[plugin_id].title;
                                let manifest = PLUGIN_LIST()[plugin_id].manifest;

                                const [install_progress, set_install_progress] = createSignal<number>(0);

                                const [is_installing, set_is_installing] = createSignal<boolean>(false);
                                const [is_install_done, set_is_install_done] = createSignal<boolean>(false);

                                onMount(() => {
                                    let unlisten: () => void;
                                    (async () => {
                                        unlisten = await listen<{current:number,total:number}>(`install_plugin_${"anime"}_${plugin_id}`, (event) => {
                                            const { current, total } = event.payload;
                                            set_install_progress((current / total) * 100);
                                        });
                                    })();
                                    onCleanup(() => {
                                        if (unlisten) {
                                            unlisten();
                                        }
                                    })
                                })

                                return (
                                    <div class={styles.add_plugin_box}>
                                        <span class={styles.add_plugin_text}>{title}</span>
                                        {is_install_done()
                                            ? <DownloadDoneRoundedIcon 
                                                sx={{
                                                    color: "green",
                                                    fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                                                }}
                                            />
                                            
                                            : <>{is_installing() 
                                                ? <CircularProgress variant="determinate" value={install_progress()} color='secondary'
                                                    size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                                                />
                                                : <IconButton
                                                    sx={{
                                                        color: "var(--color-1)",
                                                        fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                                                    }}
                                                    onClick={() => {
                                                        toast.remove();
                                                        toast("Installing plugin...",{
                                                            style: {
                                                                color:"cyan",
                                                            }
                                                        })
                                                        set_is_working(true);
                                                        set_is_installing(true);
                                                        install_plugin(
                                                            "anime",
                                                            plugin_id,
                                                            {
                                                                title,
                                                                manifest
                                                            }
                                                        )
                                                            .then((_) => {
                                                                set_is_install_done(true);
                                                            })
                                                            .catch((e) => {
                                                                console.error(e);
                                                                toast.remove();
                                                                toast.error("Something went wrong while installing plugin.",{
                                                                    style: {
                                                                        color:"red",
                                                                    }
                                                                })
                                                            })
                                                            .finally(() => {
                                                                set_is_working(false);
                                                                toast.remove();
                                                                toast.success("Plugin installed successfully.",{
                                                                    style: {
                                                                        color:"green",
                                                                    }
                                                                })
                                                            })
                                                    }}
                                                >
                                                    <FileDownloadRoundedIcon color='inherit' fontSize='inherit' />
                                                </IconButton>
                                            }</>
                                        }
                                    </div>
                                )
                            }}

                        </For>
                        : <div class={styles.no_result_box}>
                            <span class={styles.no_result_text}>No plugins available</span>
                        </div>
                    }
                </div>
            )}


            {current_tab() === 2 && (
                <div class={styles.installed_plugin_container}>
                    {Object.keys(INSTALLED_PLUGIN_LIST()).length > 0 
                        ? <For each={Object.keys(INSTALLED_PLUGIN_LIST())}>
                            {(plugin_id)=>{
                                let title = INSTALLED_PLUGIN_LIST()[plugin_id].title;
                                let version = INSTALLED_PLUGIN_LIST()[plugin_id].version;


                                const [is_removing, set_is_removing] = createSignal<boolean>(false);
                                const [is_remove_done, set_is_remove_done] = createSignal<boolean>(false);
                                const [is_updating, set_is_updating] = createSignal<boolean>(false);
                                const [update_progress, set_update_progress] = createSignal<number>(0);

                                onMount(() => {
                                    let unlisten: () => void;
                                    (async () => {
                                        unlisten = await listen<{current:number,total:number}>(`install_plugin_${"anime"}_${plugin_id}`, (event) => {
                                            const { current, total } = event.payload;
                                            set_update_progress((current / total) * 100);
                                        });
                                    })();
                                    onCleanup(() => {
                                        if (unlisten) {
                                            unlisten();
                                        }
                                    })
                                })

                                return (
                                    <div class={styles.installed_plugin_box}>
                                        {(!is_removing() && !is_remove_done() && !is_updating()) &&
                                            <IconButton
                                                sx={{
                                                    color: "cyan",
                                                    fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                                                }}
                                                onClick={() => {
                                                    get_plugin_release(
                                                        PLUGIN_LIST()[plugin_id].manifest,
                                                        "latest",
                                                    )
                                                        .then((data) => {
                                                            let should_update = semver.gt(data.version, version);
                                                            if (should_update) {
                                                                toast.remove();
                                                                toast("Updating plugin...",{
                                                                    style: {
                                                                        color:"cyan",
                                                                    }
                                                                })
                                                                set_is_working(true);
                                                                set_is_updating(true);
                                                                install_plugin(
                                                                    "anime",
                                                                    plugin_id,
                                                                    {
                                                                        title,
                                                                        manifest: PLUGIN_LIST()[plugin_id].manifest
                                                                    }
                                                                )
                                                                    .then((_) => {
                                                                        set_is_updating(false);
                                                                    })
                                                                    .catch((e) => {
                                                                        console.error(e);
                                                                        toast.remove();
                                                                        toast.error("Something went wrong while updating plugin.",{
                                                                            style: {
                                                                                color:"red",
                                                                            }
                                                                        })
                                                                    })
                                                                    .finally(() => {
                                                                        set_is_working(false);
                                                                        toast.remove();
                                                                        toast.success("Plugin updated successfully.",{
                                                                            style: {
                                                                                color:"green",
                                                                            }
                                                                        })
                                                                    })
                                                            }else{
                                                                toast.remove();
                                                                toast.success("Plugin already up to date.",{
                                                                    style: {
                                                                        color:"green",
                                                                    }
                                                                })
                                                            }
                                                        })
                                                        .catch((e) => {
                                                            console.error(e);
                                                            toast.remove();
                                                                toast.error("Something went wrong while checking for update.",{
                                                                    style: {
                                                                        color:"red",
                                                                    }
                                                                })
                                                        })
                                                }}
                                            >
                                                <UpgradeRoundedIcon color='inherit' fontSize='inherit' />
                                            </IconButton>
                                        }
                                        <span class={styles.installed_plugin_text}><span
                                            style={{
                                                overflow: "hidden",
                                                "text-overflow": "ellipsis",
                                            }}
                                        >{title}</span> <span>| v{version}</span></span>
                                        
                                        {is_updating()  
                                            ? <CircularProgress variant="determinate" value={update_progress()} color='secondary'
                                                size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                                            />

                                            : <>{is_remove_done()
                                                ? <RemoveDoneRoundedIcon
                                                    sx={{
                                                        color: "red",
                                                        fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                                                    }}
                                                />
                                                
                                                : <>{is_removing() 
                                                    ? <CircularProgress color='error'
                                                        size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                                                    />
                                                    : <IconButton
                                                        sx={{
                                                            color: "red",
                                                            fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                                                        }}
                                                        onClick={() => {
                                                            set_is_working(true);
                                                            set_is_removing(true);
                                                            remove_plugin(
                                                                "anime",
                                                                plugin_id,
                                                            )
                                                                .then((_) => {
                                                                    set_is_remove_done(true);
                                                                })
                                                                .catch((e) => {
                                                                    console.error(e);
                                                                    toast.remove();
                                                                    toast.error("Something went wrong while removing plugin.",{
                                                                        style: {
                                                                            color:"red",
                                                                        }
                                                                    })
                                                                })
                                                                .finally(()=>{
                                                                    set_is_working(false);
                                                                    toast.remove();
                                                                    toast.success("Plugin removed successfully.",{
                                                                        style: {
                                                                            color:"green",
                                                                        }
                                                                    })
                                                                })
                                                        }}
                                                    >
                                                        <RemoveCircleOutlineRoundedIcon color='inherit' fontSize='inherit' />
                                                    </IconButton>
                                                }</>
                                            }</>
                                        }
                                    </div>
                                )
                            }}

                        </For>
                        : <div class={styles.no_result_box}>
                            <span class={styles.no_result_text}>No installed plugins</span>
                        </div>
                    }
                </div>
            )}
        </div>
        
    </>)
}

const Tab = [
    "Link Plugin",
    "Add Plugins",
    "Installed Plugins"
]
