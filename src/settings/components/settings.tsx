// Tauri API


// SolidJS Imports
import { createSignal, onMount, Index, useContext, For } from "solid-js";

// SolidJS Router Imports
// import { useNavigate } from '@solidjs/router';


// SUID Imports
import { IconButton, ButtonBase, Skeleton, MenuItem } from '@suid/material';


// SUID Icon Imports
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';
import FolderRoundedIcon from '@suid/icons-material/FolderRounded';


// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import PullRefresh from '@src/app/components/pull_refresh';
import Select from "@src/app/components/Select";


// Style Imports
import styles from "../styles/settings.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';
import { pick_dir } from '@src/app/scripts/dialog';
import { get_configs, set_configs, is_available_download } from '../scripts/settings';
import { Configs } from '../types/settings_type';

// Types Import




export default function Settings() {
    // const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();
    const [CONFIGS_DATA, SET_CONFIGS_DATA] = createSignal<Configs>();

    const [is_loading, set_is_loading] = createSignal<boolean>(true);

    const get_data = () => {
        set_is_loading(true);
        
        get_configs()
            .then((data) => {
                SET_CONFIGS_DATA(data);
                set_is_loading(false);
            })
            .catch((e) => {
                console.error(e);
                toast.remove();
                toast.error("Something went wrong while getting configs.",{
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
                        <fieldset
                            style={{
                                border:"2.5px solid var(--color-1)",
                            }}
                        >
                            <legend class={`float-none w-auto`}
                                style={{
                                    color:"var(--color-1)",
                                }}
                            >General</legend>
                            
                            <div class={styles.item_container}
                                style={{
                                    padding: "12px",
                                }}
                            >
                                <div class={styles.item_box}>
                                    <h2 class={styles.item_title}>Storage Directory</h2>
                                    <div class={styles.item_input_box}>
                                        <input class={styles.item_input} readOnly
                                            value={CONFIGS_DATA()?.storage_dir ?? ""}
                                        />
                                        <ButtonBase
                                            sx={{
                                                color: 'var(--color-1)',
                                                fontSize: 'max(18px, calc((100vw + 100vh)/2*0.025))',
                                                background: 'var(--background-2)',
                                                padding: '8px',
                                            }}
                                            onClick={() => {
                                                pick_dir()
                                                    .then((data) => {
                                                        console.log(data);
                                                        if (data) {
                                                            const current_config = CONFIGS_DATA();

                                                            const new_config: Configs = {
                                                                ...current_config!,
                                                                storage_dir: data
                                                            };
                                                            set_configs(new_config)
                                                                .then(() => {
                                                                    SET_CONFIGS_DATA(new_config);
                                                                })
                                                                .catch((e) => {
                                                                    console.error(e);
                                                                    toast.remove();
                                                                    toast.error("Something went wrong while setting configs.",{
                                                                        style: {
                                                                            color:"red",
                                                                        }
                                                                    })
                                                                })
                                                        }
                                                        

                                                    })
                                                    .catch((e) => {
                                                        console.error(e);
                                                        toast.remove();
                                                        toast.error(`${e}`,{
                                                            style: {
                                                                color:"red",
                                                            }
                                                        })
                                                    })
                                            }}
                                        >
                                            <FolderRoundedIcon color="inherit" fontSize='inherit' />
                                        </ButtonBase>
                                    </div>
                                </div>

                                <div class={styles.item_box}>
                                    <h2 class={styles.item_title}>Plugin Directory</h2>
                                    <div class={styles.item_input_box}>
                                        <input class={styles.item_input} readOnly
                                            value={CONFIGS_DATA()?.plugin_dir ?? ""}
                                        />
                                        <ButtonBase
                                            sx={{
                                                color: 'var(--color-1)',
                                                fontSize: 'max(18px, calc((100vw + 100vh)/2*0.025))',
                                                background: 'var(--background-2)',
                                                padding: '8px',
                                            }}
                                            onClick={() => {
                                                pick_dir()
                                                    .then((data) => {
                                                        console.log(data);
                                                        if (data) {
                                                            const current_config = CONFIGS_DATA();

                                                            const new_config: Configs = {
                                                                ...current_config!,
                                                                plugin_dir: data
                                                            };
                                                            set_configs(new_config)
                                                                .then(() => {
                                                                    SET_CONFIGS_DATA(new_config);
                                                                })
                                                                .catch((e) => {
                                                                    console.error(e);
                                                                    toast.remove();
                                                                    toast.error("Something went wrong while setting configs.",{
                                                                        style: {
                                                                            color:"red",
                                                                        }
                                                                    })
                                                                })
                                                        }
                                                        

                                                    })
                                                    .catch((e) => {
                                                        console.error(e);
                                                        toast.remove();
                                                        toast.error(`${e}`,{
                                                            style: {
                                                                color:"red",
                                                            }
                                                        })
                                                    })
                                            }}
                                        >
                                            <FolderRoundedIcon color="inherit" fontSize='inherit' />
                                        </ButtonBase>
                                    </div>
                                </div>
                            </div>

                        </fieldset>

                        <fieldset
                            style={{
                                border:"2.5px solid var(--color-1)",
                            }}
                        >
                            <legend class={`float-none w-auto`}
                                style={{
                                    color:"var(--color-1)",
                                }}
                            >Download</legend>
                            
                            <div class={styles.item_container}
                                style={{
                                    padding: "12px",
                                }}
                            >
                                <div class={styles.item_box}>
                                    <h2 class={styles.item_title}>Worker Threads</h2>
                                    <Select 
                                        label="Default: 3 | Min: 1, Max: 8"
                                        value={CONFIGS_DATA()?.download_worker_threads ?? 3}
                                        onChange={(e)=>{(async () => {
                                            const value = e.target.value;
                                            try {
                                                const allow = !(await is_available_download());
                                                if (!allow) {
                                                    toast.remove();
                                                    toast.error(`Cannot change worker threads while there is a download task running.`,{
                                                        style: {
                                                            color:"red",
                                                        }
                                                    })
                                                    return;
                                                }
                                                const current_config = CONFIGS_DATA();
                                                const new_config: Configs = {
                                                    ...current_config!,
                                                    download_worker_threads: value
                                                };
                                            
                                                set_configs(new_config)
                                                    .then(() => {
                                                        SET_CONFIGS_DATA(new_config);
                                                    })
                                                    .catch((e) => {
                                                        console.error(e);
                                                        toast.remove();
                                                        toast.error("Something went wrong while setting configs.",{
                                                            style: {
                                                                color:"red",
                                                            }
                                                        })
                                                    })
                                            }catch (e) {
                                                console.error(e);
                                                toast.remove();
                                                toast.error(`Something went wrong while setting configs.`,{
                                                    style: {
                                                        color:"red",
                                                    }
                                                })
                                            }
                                        })()}}
                                    >
                                        <For each={[...Array(8)]}>
                                            {(_, index)=>(
                                                <MenuItem value={index()+1}>{index()+1}</MenuItem>
                                            )}
                                        </For>
                                    </Select>
                                </div>

                            </div>

                        </fieldset>


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

