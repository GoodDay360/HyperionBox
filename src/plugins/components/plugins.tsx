// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Imports
import { createSignal, onMount, For, onCleanup, createEffect, on } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { Button, IconButton, ButtonBase, CircularProgress, ButtonGroup } from '@suid/material';

// SUID Icon Imports
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import FileDownloadRoundedIcon from '@suid/icons-material/FileDownloadRounded';
import DownloadDoneRoundedIcon from '@suid/icons-material/DownloadDoneRounded';
import RemoveDoneRoundedIcon from '@suid/icons-material/RemoveDoneRounded';
import RemoveCircleOutlineRoundedIcon from '@suid/icons-material/RemoveCircleOutlineRounded';
import UpgradeRoundedIcon from '@suid/icons-material/UpgradeRounded';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import LinkRoundedIcon from '@suid/icons-material/LinkRounded';

// Solid Toast
import toast from 'solid-toast';

// Semver Imports
import semver from "semver";



// Component Imports
import LazyLoadImage from '@src/app/components/lazyloadimage';

// Style Imports
import styles from "../styles/plugin.module.css"

// Script Imports
import { get_plugin_list, install_plugin, get_installed_plugin_list, remove_plugin, get_plugin_release } from '../scripts/manage_plugins';
import { search_in_plugin } from '../scripts/request_plugin';

// Script Type Imports
import { PluginData, InstalledPluginData } from '../types/manage_plugin_type';
import { SearchInPluginData } from '../types/request_plugin_type';

const AVAILABLE_SOUCRES: Record<string, string> = {
    "anime": "Anime",
    "movie": "Movie/TV",
};


export default function Plugin() {
    const navigate = useNavigate();
    const [queryParams] = useSearchParams();

    const link_from:{source: string, id:string, title:string} = {
        source: queryParams?.link_source as string ?? "", 
        id: queryParams?.link_id as string ?? "", 
        title: queryParams?.link_title as string ?? ""
    };
    const [link_to, set_link_to] = createSignal<{state:boolean, plugin_id:string, id:string, title:string}>({state:false, plugin_id:"", id:"", title:""});

    const [search_title, set_search_title] = createSignal(link_from.title);
    const [select_source_id, set_select_source_id] = createSignal<string>(link_from.source ||Object.keys(AVAILABLE_SOUCRES)[0]);


    const [current_tab, set_current_tab] = createSignal(link_from.source ? 0 : 1);

    
    const [PLUGIN_DATA, SET_PLUGIN_DATA] = createSignal<Record<string, PluginData>>({});
    const [INSTALLED_PLUGIN_DATA, SET_INSTALLED_PLUGIN_DATA] = createSignal<Record<string, InstalledPluginData>>({});
    const [SEARCH_IN_PLUGIN_DATA, SET_SEARCH_IN_PLUGIN_DATA] = createSignal<Record<string, SearchInPluginData[]>>({});

    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [is_working, set_is_working] = createSignal<boolean>(false);
    

    const request_search_in_plugin = () => {
        if (current_tab() === 0 && link_from.id) {
            set_is_loading(true);
            const plugin_id_list = Object.keys(INSTALLED_PLUGIN_DATA());
            Promise.all(
                plugin_id_list.map(plugin_id =>
                    search_in_plugin(select_source_id(), plugin_id, search_title(), 1)
                        .then(data => [plugin_id, data])
                        .catch(() => [plugin_id, []])
                )
            )
                .then(results => {
                    const data = Object.fromEntries(results);
                    SET_SEARCH_IN_PLUGIN_DATA(data);
                    console.log(data);
                })
                .finally(() => {
                    set_is_loading(false);
                });
        }
    }

    const get_data = () => {
        set_is_loading(true);
        SET_PLUGIN_DATA({});
        SET_INSTALLED_PLUGIN_DATA({});
        SET_SEARCH_IN_PLUGIN_DATA({});
        
        Promise.all([
            get_plugin_list(select_source_id()),
            get_installed_plugin_list(select_source_id()),
        ])
            .then(([plugin_data, installed_plugin_data]) => {
                SET_PLUGIN_DATA(plugin_data);
                SET_INSTALLED_PLUGIN_DATA(installed_plugin_data);
                request_search_in_plugin();
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                toast.remove();
                toast.error("Something went wrong.", {
                    style: {
                        color: "red",
                    }
                });
            })
            .finally(() => {
                set_is_loading(false);
            });
    }
    

    onMount(() => {
        get_data();

    })

    createEffect(on(current_tab, () => {
        if (is_loading()) return;
        set_is_loading(true);
        get_installed_plugin_list(select_source_id())
            .then((data) => {    
                console.log(data);
                SET_INSTALLED_PLUGIN_DATA(data);
                if (current_tab() === 0) {
                    if (Object.keys(SEARCH_IN_PLUGIN_DATA()).length === 0) {
                        request_search_in_plugin()
                    }
                };
            })
            .finally(() => {
                set_is_loading(false);
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
                            <>{(index() !== 0 || (index() === 0 && link_from.id)) &&
                                <ButtonBase disabled={is_working() || is_loading()}
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
                            }</>
                        )}
                    </For>
                </div>
            </div>
            <div class={styles.source_container}>
                <ButtonGroup variant="outlined" color="primary" 
                    sx={{
                        border: "none",
                        outline:"none",
                        "&:hover": {
                            border: "none",
                            outline:"none",
                        }
                    }}
                >
                    <For each={Object.keys(AVAILABLE_SOUCRES)}>
                        {(source_id)=>(
                            <Button disabled={is_loading() || is_working()}
                                sx={{
                                    border:"none",
                                    outline:"none",
                                    background: select_source_id() === source_id ? "var(--background-2)" : "var(--background-1)",
                                    textTransform: "none",
                                    color: "var(--color-1)",
                                    fontSize: "calc((100vw + 100vh)/2*0.025)",
                                    "&:hover": {
                                        border: "none",
                                        outline:"none",
                                    }
                                }}
                                onClick={()=>{
                                    set_select_source_id(source_id);
                                    get_data();
                                }}
                            >{AVAILABLE_SOUCRES[source_id]}
                            </Button>
                        )}
                    </For>
                </ButtonGroup>
            </div>
            {is_loading()
                ? <div class={styles.loading_box}>
                    <CircularProgress color='secondary'
                        size={"max(25px, calc((100vw + 100vh)/2*0.045))"}        
                    />
                </div>       
                :<>
                    {/* Link Plugin Component (Only show if link option specify) */}
                    {(current_tab() === 0 && link_from.id) && (<>
                        {Object.keys(INSTALLED_PLUGIN_DATA()).length > 0 
                            ? <>
                                <div class={styles.link_plugin_container}>
                                    <form class={styles.search_container}
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            request_search_in_plugin();
                                        }}
                                        style={{
                                            "padding-left": "12px",
                                        }}
                                    > 
                                        <input class={styles.search_input} type='text' placeholder='Search'
                                            value={search_title()}
                                            onInput={(e) => {
                                                const value = e.currentTarget.value;
                                                set_search_title(value);
                                            }}
                                        /> 
                                        <ButtonBase
                                            sx={{
                                                color: 'var(--color-1)',
                                                fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                                minHeight: "100%",
                                                borderTopRightRadius: "16px",
                                                borderBottomRightRadius: "16px",
                                                padding: "8px"
                                            }}
                                            type='submit'
                                            disabled={is_loading()}
                                        >
                                            <SearchRoundedIcon color="inherit" fontSize='inherit' />
                                        </ButtonBase>
                                    </form>
                                    <For each={Object.keys(SEARCH_IN_PLUGIN_DATA()).filter(plugin_id => Object.keys(INSTALLED_PLUGIN_DATA()).includes(plugin_id))}>
                                        {(plugin_id) => (
                                            <div class={styles.content_container}>
                                                <div class={styles.content_header_container}>
                                                    <h2 class={styles.content_header_title}>{INSTALLED_PLUGIN_DATA()[plugin_id].title}</h2>
                                                </div>
                                                <div class={`${styles.content_data_container} ${["android","ios" ].includes(platform()) && "hide_scrollbar"}`}
                                                    onWheel={(e) => {
                                                        e.preventDefault();
                                                        e.currentTarget.scrollBy({
                                                            left: e.deltaY,
                                                            behavior: "smooth",
                                                        });
                                                    }}
                                                >
                                                    {SEARCH_IN_PLUGIN_DATA()[plugin_id].length > 0 
                                                        ? <For each={SEARCH_IN_PLUGIN_DATA()[plugin_id]}>
                                                            {(item) => <div class={styles.content_data_box}>
                                                                <ButtonBase
                                                                    sx={{
                                                                        width: "100%",
                                                                        height: "auto",
                                                                    }}
                                                                    onClick={() => {
                                                                        set_link_to({
                                                                            state: true,
                                                                            plugin_id: plugin_id,
                                                                            id: item.id,
                                                                            title: item.title
                                                                        })
                                                                    }}
                                                                >
                                                                    <LazyLoadImage 
                                                                        src={item.cover}
                                                                        className={styles.content_data_img}

                                                                        skeleton_sx={{
                                                                            width: "calc((100vw + 100vh)/2*0.18)",
                                                                            height: "calc((100vw + 100vh)/2*0.25)",
                                                                            background: "var(--background-2)",
                                                                            borderRadius: "5px",
                                                                        }}
                                                                    />
                                                                </ButtonBase>
                                                                <span class={styles.content_data_title}>{item.title}</span>
                                                            </div>}
                                                        </For>
                                                        : <div class={styles.content_data_no_result_box}>
                                                            <span class={styles.no_result_text}>No result available</span>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                                {link_to().state && (
                                    <div class={styles.link_plugin_feedback_container}>
                                        <div class={`${styles.link_plugin_feedback_box} animate__animated animate__zoomIn`}
                                            style={{
                                                "--animate-duration": "250ms",
                                            }}
                                        >
                                            <LinkRoundedIcon 
                                                sx={{
                                                    color: "var(--color-1)",
                                                    fontSize: "calc((100vw + 100vh)/2*0.065)",
                                                }}
                                            />
                                            <span class={styles.link_plugin_feedback_title}>Link Plugin</span>
                                            <span class={styles.link_plugin_feedback_text}>This will use "{link_to().plugin_id}" plugin to stream and download "{link_to().title}".</span>
                                            <div class={styles.link_plugin_feedback_button_box}>
                                                {is_working()
                                                    ? <CircularProgress color='secondary'
                                                        size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                                                    />
                                                    : <>
                                                        <Button variant='text' color="error"
                                                            sx={{
                                                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                                                textTransform: "none",
                                                                maxWidth: "fit-content",
                                                                minWidth: "fit-content"
                                                            }}
                                                            onClick={() => {
                                                                set_link_to({
                                                                    state: false,
                                                                    plugin_id: "",
                                                                    id: "",
                                                                    title: ""
                                                                })
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>

                                                        <Button variant='text' color="primary"
                                                            sx={{
                                                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                                                textTransform: "none",
                                                                maxWidth: "fit-content",
                                                                minWidth: "fit-content"
                                                            }}
                                                            onClick={() => {
                                                                set_is_working(true);
                                                                invoke("link_plugin", { 
                                                                    source: select_source_id(),
                                                                    pluginId: link_to().plugin_id,
                                                                    fromId: link_from.id,
                                                                    toId: link_to().id
                                                                })
                                                                    .then(() => {
                                                                        toast.remove();
                                                                        toast.success("Plugin linked successfully.",{
                                                                            style: {
                                                                                color:"green",
                                                                            }
                                                                        });
                                                                        navigate(-1);
                                                                    })
                                                                    .catch((e) => {
                                                                        console.error(e);
                                                                        toast.remove();
                                                                        toast.error("Something went wrong while linking plugin.",{
                                                                            style: {
                                                                                color:"red",
                                                                            }
                                                                        });
                                                                    })
                                                                    .finally(() => {
                                                                        set_is_working(false);
                                                                    })
                                                            }}
                                                        >
                                                            Link
                                                        </Button>
                                                    </>
                                                }
                                                
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                            : <div class={styles.no_result_box}>
                                <span class={styles.no_result_text}>No installed plugins.</span>
                            </div>
                        }
                    </>)}
                    {/* --- */}
                    
                    {/* Add Plugin Component */}
                    {current_tab() === 1 && (
                        <div class={styles.add_plugin_container}>
                            {Object.keys(PLUGIN_DATA()).filter((plugin_id)=>{return !INSTALLED_PLUGIN_DATA()[plugin_id]}).length > 0 
                                ? <For each={Object.keys(PLUGIN_DATA()).filter((plugin_id)=>{return !INSTALLED_PLUGIN_DATA()[plugin_id]})}>
                                    {(plugin_id)=>{
                                        let title = PLUGIN_DATA()[plugin_id].title;
                                        let manifest = PLUGIN_DATA()[plugin_id].manifest;

                                        const [install_progress, set_install_progress] = createSignal<number>(0);

                                        const [is_installing, set_is_installing] = createSignal<boolean>(false);
                                        const [is_install_done, set_is_install_done] = createSignal<boolean>(false);

                                        onMount(() => {
                                            let unlisten: () => void;
                                            (async () => {
                                                unlisten = await listen<{current:number,total:number}>(`install_plugin_${select_source_id()}_${plugin_id}`, (event) => {
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
                                                                set_install_progress(0);
                                                                set_is_working(true);
                                                                set_is_installing(true);
                                                                
                                                                install_plugin(
                                                                    select_source_id(),
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
                                    <span class={styles.no_result_text}>No plugins available.</span>
                                </div>
                            }
                        </div>
                    )}
                    {/* --- */}

                    {/* Installed Plugin Component */}
                    {current_tab() === 2 && (
                        <div class={styles.installed_plugin_container}>
                            {Object.keys(INSTALLED_PLUGIN_DATA()).length > 0 
                                ? <For each={Object.keys(INSTALLED_PLUGIN_DATA())}>
                                    {(plugin_id)=>{
                                        const title = INSTALLED_PLUGIN_DATA()[plugin_id].title;
                                        const [version, set_version] = createSignal<string>(INSTALLED_PLUGIN_DATA()[plugin_id].version);


                                        const [is_removing, set_is_removing] = createSignal<boolean>(false);
                                        const [is_remove_done, set_is_remove_done] = createSignal<boolean>(false);
                                        const [is_updating, set_is_updating] = createSignal<boolean>(false);
                                        const [update_progress, set_update_progress] = createSignal<number>(0);

                                        onMount(() => {
                                            let unlisten: () => void;
                                            (async () => {
                                                unlisten = await listen<{current:number,total:number}>(`install_plugin_${select_source_id()}_${plugin_id}`, (event) => {
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
                                                                PLUGIN_DATA()[plugin_id].manifest,
                                                                "latest",
                                                            )
                                                                .then((data) => {
                                                                    let should_update = semver.gt(data.version, version());
                                                                    if (should_update) {
                                                                        set_update_progress(0);
                                                                        toast.remove();
                                                                        toast("Updating plugin...",{
                                                                            style: {
                                                                                color:"cyan",
                                                                            }
                                                                        })
                                                                        set_is_working(true);
                                                                        set_is_updating(true);
                                                                        install_plugin(
                                                                            select_source_id(),
                                                                            plugin_id,
                                                                            {
                                                                                title,
                                                                                manifest: PLUGIN_DATA()[plugin_id].manifest
                                                                            }
                                                                        )
                                                                            .then((_) => {
                                                                                set_is_updating(false);
                                                                                set_version(data.version);
                                                                                
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
                                                                        set_is_working(false);
                                                                        toast.remove();
                                                                        toast.success("Plugin already up to date.",{
                                                                            style: {
                                                                                color:"green",
                                                                            }
                                                                        })
                                                                    }
                                                                })
                                                                .catch((e) => {
                                                                    set_is_working(false);
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
                                                >{title}</span> <span>| v{version()}</span></span>
                                                
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
                                                                        select_source_id(),
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
                                    <span class={styles.no_result_text}>No installed plugins.</span>
                                </div>
                            }
                        </div>
                    )}
                    {/* --- */}
                </>
            }
        </div>
        
    </>)
}

const Tab = [
    "Link Plugin",
    "Add Plugins",
    "Installed Plugins"
]
