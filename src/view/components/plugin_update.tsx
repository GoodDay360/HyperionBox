// Tauri API
import { listen } from '@tauri-apps/api/event';

// SolidJS Imports
import { createSignal, onMount, onCleanup } from "solid-js";

// SolidJS Router Imports


// SUID Imports
import { 
    Button,
    Box, LinearProgress

} from '@suid/material';

// SUID Icon Imports
import ExtensionRoundedIcon from '@suid/icons-material/ExtensionRounded';

// Solid Toast
import toast from 'solid-toast';

// Components Import


// Styles Import
import styles from "../styles/plugin_update.module.css"

// Script Import

import { install_plugin } from '@src/plugins/scripts/manage_plugins';

// Types Import


export default function PluginUpdate({
    source,
    plugin_id,
    pluginManifest,
    onClose = () => {},
    onSuccess = () => {},
}:{
    source: string,
    plugin_id: string,
    pluginManifest: {
        title:string,
        manifest:string,
    },
    onClose?: () => void,
    onSuccess?: () => void,

}) {

    
    const [is_installing, set_is_installing] = createSignal(false);

    const [install_progress, set_install_progress] = createSignal(0);

    onMount(() => {
        let unlisten: () => void;
        (async () => {
            unlisten = await listen<{current:number,total:number}>(`install_plugin_${source}_${plugin_id}`, (event) => {
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

    return (<div class={styles.container}>
        <div class={`${styles.box} animate__animated animate__zoomIn`}
            style={{
                "--animate-duration": "250ms",
            }}
        >
            <ExtensionRoundedIcon
                sx={{
                    color: "var(--color-1)",
                    fontSize: "calc((100vw + 100vh)/2*0.06)",
                }}
            />
            <span class={styles.title}>Plugin Update</span>
            <span class={styles.text}>There is a new version available for plugin "{pluginManifest.title}".</span>
            
            {!is_installing()
                
                ? <div class={styles.button_box}>
                    <Button variant='text' color="warning"
                        sx={{
                            fontSize: "calc((100vw + 100vh)/2*0.0225)",
                            textTransform: "none",
                            maxWidth: "fit-content",
                            minWidth: "fit-content"
                        }}
                        onClick={onClose}
                    >
                        Later
                    </Button>
                    <Button variant='contained' color="primary" disabled={is_installing()}
                        sx={{
                            fontSize: "calc((100vw + 100vh)/2*0.0225)",
                            textTransform: "none",
                            maxWidth: "fit-content",
                            minWidth: "fit-content"
                        }}
                        onClick={()=>{(async ()=>{
                            set_is_installing(true);
                            install_plugin(source, plugin_id, pluginManifest)
                                .then(() => {
                                    toast.remove();
                                    toast.success("Plugin updated successfully.",{style:{color:"green"}});
                                    onSuccess();
                                    onClose();
                                })
                                .catch((e) => {
                                    console.error(e);
                                    toast.remove();
                                    toast.error("Something went wrong while updating plugin.",{style:{color:"red"}});
                                })
                                .finally(() => {
                                    set_is_installing(false);
                                })
                        })()}}
                    >
                        Update
                    </Button>
                </div>
                : <Box sx={{ width: "100%" }}>
                    <LinearProgress variant="determinate" value={install_progress()} />
                </Box>
            }
        </div>
    </div>)
}
