// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app'
import {
    checkPermissions,
    requestPermissions,
    install
} from "@kingsword/tauri-plugin-android-package-install";

// SolidJS Imports
import { createSignal, onMount, onCleanup } from "solid-js";

// SolidJS Router Imports



// SUID Imports
import { Button, Box, LinearProgress } from '@suid/material';

// SUID Icon Imports

import UpdateRoundedIcon from '@suid/icons-material/UpdateRounded';

// Solid Toast
import { toast } from 'solid-toast';

// Style Imports
import styles from "../styles/update.module.css"

// Scripts Imports
import { check_update } from '../scripts/update';

// Types Imports
import { CheckUpdate } from '../types/update_type';


export default function Update() {

    const [current_version, set_current_version] = createSignal<string>("");
    const [progress, set_progress] = createSignal<number>(0);
    const [is_update_available, set_update_available] = createSignal<CheckUpdate>({state: false, version: "", notes: ""});
    const [is_working, set_is_working] = createSignal(false);
    const [is_done_download, set_is_done_download] = createSignal(false);

    let update_file_path:string = "";

    onMount(()=>{
        check_update()
            .then(async (data) => {
                console.log(data);
                set_current_version(await getVersion());
                set_update_available(data);
            })
    })

    onMount(() => {
        let unlisten = () => {};
        (async () => {
            unlisten = await listen<{current:number,total:number}>("update_progress", (event) => {
                const { current, total } = event.payload;
                set_progress((current / total) * 100);
            })
        })()
        onCleanup(() => {
            unlisten();
        })
    })

    const install_update = async () => {
        try {
            let perm = await checkPermissions();
            console.log(perm);
            if (perm !== "granted") {
                await requestPermissions();
            }
            if (perm === "granted") {
                await install(update_file_path);
                toast.remove();
                toast.success("Update installed successfully.",{
                    style: {
                        color:"green",
                    }
                });
            }
        }catch(e){
            console.error(e);
            toast.remove();
            toast.error("Something went wrong while installing update.",{
                style: {
                    color:"red",
                }
            });
        }
    }

    return (<>
        {is_update_available().state &&
            <div class={styles.container}>
                <div class={`${styles.box} animate__animated animate__zoomIn`}
                    style={{
                        "--animate-duration": "250ms",
                    }}
                >
                    <UpdateRoundedIcon 
                        sx={{
                            color: "var(--color-1)",
                            fontSize: "calc((100vw + 100vh)/2*0.065)",
                        }}
                    />
                    <span class={styles.title}>Update Available</span>
                    <ul class={styles.content_box}>
                        <li class={styles.text}>Notes:
                            <ul>
                                <span class={styles.text}>{is_update_available().notes}</span>
                            </ul>
                        </li>
                        <li class={styles.text}>Version
                            <ul>
                                <li class={styles.text}>Current: v{current_version()}</li>
                                <li class={styles.text}>New: v{is_update_available().version}</li>
                            </ul>
                        </li>
                    </ul>
                    
                    <div class={styles.button_box}>
                        {!is_done_download() && <>
                            {is_working()
                                ? <Box sx={{ width: "100%" }}>
                                    <LinearProgress variant="determinate" value={progress()} />
                                </Box>
                                : <>
                                    <Button variant='text' color="warning"
                                        sx={{
                                            fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                            textTransform: "none",
                                            maxWidth: "fit-content",
                                            minWidth: "fit-content"
                                        }}
                                        onClick={() => {
                                            set_update_available({state: false, version: "", notes: ""});
                                        }}
                                    >
                                        Later
                                    </Button>

                                    <Button variant='contained' color="primary"
                                        sx={{
                                            fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                            textTransform: "none",
                                            maxWidth: "fit-content",
                                            minWidth: "fit-content"
                                        }}
                                        onClick={() => {
                                            set_progress(0);
                                            set_is_working(true);
                                            invoke<string|null>("update")
                                                .then((data) => {
                                                    if (data){
                                                        console.log(data);
                                                        update_file_path = data ?? "";
                                                        set_is_done_download(true);
                                                        install_update();
                                                    }
                                                    
                                                    toast.remove();
                                                    toast.success("Download successfully.",{
                                                        style: {
                                                            color:"green",
                                                        }
                                                    });
                                                })
                                                .catch((e) => {
                                                    console.error(e);
                                                    toast.remove();
                                                    toast.error("Something went wrong while updating.",{
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
                                        Download
                                    </Button>
                                </>
                            }
                        </>}

                        {is_done_download() && <>
                            <Button variant='text' color="warning"
                                sx={{
                                    fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                    textTransform: "none",
                                    maxWidth: "fit-content",
                                    minWidth: "fit-content"
                                }}
                                onClick={() => {
                                    set_update_available({state: false, version: "", notes: ""});
                                }}
                            >
                                Cancel
                            </Button>

                            <Button variant='contained' color="primary"
                                sx={{
                                    fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                    textTransform: "none",
                                    maxWidth: "fit-content",
                                    minWidth: "fit-content"
                                }}
                                onClick={() => {
                                    install_update();
                                }}
                            >
                                Install
                            </Button>
                        </>}
                        
                    </div>
                </div>
            </div>
        }
    </>)
}