// Tauri API


// SolidJS Imports
import { createSignal, onMount, Index, useContext, For } from "solid-js";

// SolidJS Router Imports
// import { useNavigate } from '@solidjs/router';


// SUID Imports
import { IconButton, ButtonBase, Skeleton, MenuItem, Button } from '@suid/material';


// SUID Icon Imports
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';
import FolderRoundedIcon from '@suid/icons-material/FolderRounded';
import SaveRoundedIcon from '@suid/icons-material/SaveRounded';

// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import PullRefresh from '@src/app/components/pull_refresh';
import Select from "@src/app/components/Select";
import Login from "./login";
import ChangePassword from "./change_password";


// Style Imports
import styles from "../styles/settings.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';
import { pick_dir } from '@src/app/scripts/dialog';
import { 
    get_configs, set_configs, is_available_download, 
    get_storage_size, format_bytes, clean_storage
} from '../scripts/settings';
import { verify } from '../scripts/profile';

// Types Import
import { Configs } from '../types/settings_type';


export default function Settings() {
    // const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();
    const [CONFIGS_DATA, SET_CONFIGS_DATA] = createSignal<Configs>();
    const [STORAGE_SIZE, SET_STORAGE_SIZE] = createSignal<number>(0);

    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [is_working, set_is_working] = createSignal<boolean>(false);

    const [show_login, set_show_login] = createSignal<boolean>(false);
    const [show_change_password, set_show_change_password] = createSignal<boolean>(false);

    /* Verify Hypersync Token if logged in */
    onMount(()=>{(async()=>{
        const configs = await get_configs();
        if (configs.hypersync_token) {
            verify(configs.hypersync_token)
                .then((status)=>{
                    if (!status) {
                        toast.remove();
                        toast.error("Your HyperSync profile token has expired or invalidated. Try logging in again.",{style: {color: "red"}});
                    }
                });
        }
    })()})
    /* --- */

    const get_data = async () => {
        if (is_working()) return;

        set_is_loading(true);

        try {
            const configs_data = await get_configs()
            SET_CONFIGS_DATA(configs_data);

            const storage_size = await get_storage_size();
            SET_STORAGE_SIZE(storage_size);

            console.log("STORAGE SIZE: ", storage_size);

            set_is_loading(false);
                
        }catch (e) {
            console.error(e);
            console.error(e);
            toast.remove();
            toast.error("Something went wrong while getting configs.",{
                style: {
                    color:"red",
                }
            })
        }
        
        
        
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
            {(((context?.screen_size?.()?.width ?? 0) > 550) && !is_working()) &&
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
                        {/* Profile */}
                        <fieldset
                            style={{
                                border:"2.5px solid var(--color-1)",
                            }}
                        >
                            <legend class={`float-none w-auto`}
                                style={{
                                    color:"var(--color-1)",
                                }}
                            >Profile</legend>
                            
                            <div class={styles.item_container}
                                style={{
                                    padding: "12px",
                                }}
                            >
                                <div class={styles.item_box}>
                                    {CONFIGS_DATA()?.hypersync_token
                                        ? <div 
                                            style={{
                                                display: "flex",
                                                "flex-direction":"column",
                                                gap: "12px"
                                            }}
                                        >
                                            <span class={styles.item_text}>
                                                Logged in using HyperSync Server:
                                            </span>
                                            <input class={styles.item_input} readOnly
                                                value={CONFIGS_DATA()?.hypersync_server ?? ""}
                                            />

                                            <div
                                                style={{
                                                    display: "flex",
                                                    "flex-direction": "row",
                                                    gap: "8px"
                                                }}
                                            >
                                                <Button variant="contained" color="error" disabled={is_loading() || is_working()}
                                                    sx={{
                                                        textTransform: "none",
                                                        color: "var(--color-1)",
                                                        fontSize: "calc((100vw + 100vh)/2*0.02)",
                                                    }}
                                                    onClick={() => {
                                                        const new_config = {
                                                            ...CONFIGS_DATA()!,
                                                            hypersync_token: undefined,
                                                        }
                                                        set_configs(new_config)
                                                            .then(() => {
                                                                get_data();
                                                                toast.remove();
                                                                toast.success("Logged out successfully.",{
                                                                    style: {
                                                                        color:"green",
                                                                    }
                                                                })
                                                            })
                                                            .catch((e) => {
                                                                console.error(e);
                                                                toast.remove();
                                                                toast.error("Something went wrong while logging out.",{
                                                                    style: {
                                                                        color:"red",
                                                                    }
                                                                })
                                                            })
                                                    }}
                                                >Logout</Button>

                                                <Button variant="contained" color="primary" disabled={is_loading() || is_working()}
                                                    sx={{
                                                        textTransform: "none",
                                                        color: "var(--color-1)",
                                                        fontSize: "calc((100vw + 100vh)/2*0.02)",
                                                    }}
                                                    onClick={() => {
                                                        set_show_change_password(true);
                                                    }}
                                                >Change Password</Button>
                                            </div>
                                        </div>
                                        : <div 
                                            style={{
                                                display: "flex",
                                                "flex-direction":"column",
                                                gap: "12px"
                                            }}
                                        >
                                            <h2 class={styles.item_title}>HyperSync Server</h2>
                                            <form class={styles.item_input_box}
                                                onSubmit={(e)=>{
                                                    e.preventDefault();
                                                        const current_config = CONFIGS_DATA()!;

                                                        set_configs(current_config)
                                                            .then(() => {
                                                                get_data();
                                                                toast.remove();
                                                                toast.success("HyperSync server set successfully.",{
                                                                    style: {
                                                                        color:"green",
                                                                    }
                                                                })
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
                                                }}
                                            >
                                                <input class={styles.item_input}
                                                    placeholder="Leave empty and save to use default."
                                                    onChange={(e)=>{
                                                        const current_config = CONFIGS_DATA();

                                                        const new_config: Configs = {
                                                            ...current_config!,
                                                            hypersync_server: e.target.value
                                                        };

                                                        SET_CONFIGS_DATA(new_config);
                                                    }}
                                                    value={CONFIGS_DATA()?.hypersync_server ?? ""}
                                                />
                                                <ButtonBase
                                                    sx={{
                                                        color: 'aqua',
                                                        fontSize: 'max(18px, calc((100vw + 100vh)/2*0.025))',
                                                        background: 'var(--background-2)',
                                                        padding: '8px',
                                                    }}
                                                    type="submit"
                                                >
                                                    <SaveRoundedIcon color="inherit" fontSize='inherit' />
                                                </ButtonBase>
                                            </form>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    "flex-direction": "row",
                                                    gap: "8px"
                                                }}
                                            >
                                                
                                                <Button variant="contained" color="primary" disabled={is_loading() || is_working()}
                                                    sx={{
                                                        textTransform: "none",
                                                        color: "var(--color-1)",
                                                        fontSize: "calc((100vw + 100vh)/2*0.02)",
                                                    }}
                                                    onClick={() => {
                                                        set_show_login(true);
                                                    }}
                                                >Login with HyperSync</Button>

                                            </div>
                                        </div>
                                    }
                                </div>
                                

                                
                            </div>

                        </fieldset>
                        {/* --- */}

                        {/* General */}
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

                                <div class={styles.item_box}>
                                    <h2 class={styles.item_title}>Cache Directory</h2>
                                    <div class={styles.item_input_box}>
                                        <input class={styles.item_input} readOnly
                                            value={CONFIGS_DATA()?.cache_dir ?? ""}
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
                                                                cache_dir: data
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
                        {/* --- */}
                        
                        {/* Download */}
                        <fieldset
                            style={{
                                border:"2.5px solid var(--color-1)",
                            }}
                        >
                            <legend class={`float-none w-auto`}
                                style={{
                                    color:"var(--color-1)",
                                }}
                            >Download & Cache</legend>
                            
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
                                <div class={styles.item_box}
                                    style={{}}
                                >
                                    <h2 class={styles.item_title}>Storage Size: {format_bytes(STORAGE_SIZE())}</h2>
                                    <div
                                        style={{
                                            display: "flex",
                                            "flex-direction": "row",
                                            gap: "8px"
                                        }}
                                    >
                                        <Button variant="contained" color="secondary" disabled={is_loading() || is_working()}
                                            sx={{
                                                color: "var(--color-1)",
                                                fontSize: "calc((100vw + 100vh)/2*0.018)",
                                            }}
                                            onClick={() => {
                                                set_is_working(true);
                                                clean_storage()
                                                    .then(async () => {
                                                        set_is_working(false);
                                                        await get_data();
                                                        toast.remove();
                                                        toast.success("Storage cleaned successfully.",{
                                                            style: {
                                                                color:"green",
                                                            }
                                                        })
                                                    })
                                                    .catch((e) => {
                                                        console.error(e);
                                                        toast.remove();
                                                        toast.error("Something went wrong while cleaning storage.",{
                                                            style: {
                                                                color:"red",
                                                            }
                                                        })
                                                    })
                                                    .finally(() => {
                                                        set_is_working(false);
                                                    })
                                            }}
                                        >Clean Storage</Button>

                                    </div>
                                </div>

                            </div>

                        </fieldset>
                        {/* --- */}

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
            
        {show_login() &&
            <Login
                onClose={()=>{
                    set_show_login(false);
                }}
                onSuccess={()=>{
                    get_data()
                }}
            />
        }

        {show_change_password() &&
            <ChangePassword
                onClose={()=>{
                    set_show_change_password(false);
                }}
                onSuccess={()=>{
                    get_data()
                }}
            />
        }

        {/* Navigation Bar For Small Screen Width */}
        {(context?.screen_size?.()?.width ?? 0) <= 550 &&
            <NavigationBar type='bottom'/>
        }
    </>)
}

