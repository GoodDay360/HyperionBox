// Tauri API


// SolidJS Imports
import { createSignal, onMount, For } from "solid-js";

// SolidJS Router Imports


// SUID Imports
import { 
    Button,
    CircularProgress, MenuItem,
    Radio, RadioGroup, FormControlLabel

} from '@suid/material';

// SUID Icon Imports
import AccountTreeRoundedIcon from '@suid/icons-material/AccountTreeRounded';

// Solid Toast
import toast from 'solid-toast';

// Components Import


// Styles Import
import styles from "../styles/select_sources.module.css"

// Script Import
import { get_configs, set_configs } from "@src/settings/scripts/settings";


// Types Import
import { Configs } from "@src/settings/types/settings_type";

const AVAILABLE_SOUCRES: Record<string, string> = {
    "anime": "Anime",
    "movie": "Movie/TV",
};

export default function SelectSources({
    onClose = () => {},
    onSuccess = () => {},
}:{
    onClose?: () => void,
    onSuccess?: () => void,

}) {

    const [is_working, set_is_working] = createSignal(false);
    const [is_loading, set_is_loading] = createSignal(false);


    const [select_source_id, set_select_source_id] = createSignal<string>("");


    onMount(()=>{
        set_is_loading(true);
        get_configs().
            then((data)=>{
                set_select_source_id(data.selected_source_id);
                set_is_loading(false);
            })
            .catch((e)=>{
                console.error(e);
                toast.remove();
                toast.error("Something went wrong while getting configs.",{
                    style: {
                        color:"red",
                    }
                })
            })
    })


    return (<div class={styles.container}>
        <div class={`${styles.box} animate__animated animate__zoomIn`}
            style={{
                "--animate-duration": "250ms",
            }}
        >
            <AccountTreeRoundedIcon
                sx={{
                    color: "var(--color-1)",
                    fontSize: "calc((100vw + 100vh)/2*0.06)",
                }}
            />
            <span class={styles.title}>Select Source</span>
            {!is_loading()
                ? <div class={styles.options_box}>
                    
                    <RadioGroup
                        value={select_source_id()}
                        onChange={(_, value)=>{
                            set_select_source_id(value);
                        }}
                    >
                        <For each={Object.keys(AVAILABLE_SOUCRES)}>
                            {(source_id)=> (
                                <FormControlLabel value={source_id}  label={AVAILABLE_SOUCRES[source_id]} 
                                    control={<Radio 
                                        sx={{
                                            color: "var(--color-1)",
                                        }}
                                    />}
                                    sx={{
                                        color: "var(--color-1)",
                                        userSelect: "none",
                                        "& .MuiFormControlLabel-label": {
                                            fontSize: "calc((100vw + 100vh)/2*0.025)",
                                        }
                                    }}
                                />
                            )}
                        </For>
                        
                        
                    </RadioGroup>

                </div>
                : <CircularProgress color='secondary'
                    size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                />
            }
            <div class={styles.button_box}>
                {!is_working()
                    ? <>
                        <Button variant='text' color="error"
                            sx={{
                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                textTransform: "none",
                                maxWidth: "fit-content",
                                minWidth: "fit-content"
                            }}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button variant='text' color="primary" disabled={is_loading()}
                            sx={{
                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                textTransform: "none",
                                maxWidth: "fit-content",
                                minWidth: "fit-content"
                            }}
                            onClick={()=>{(async ()=>{
                                set_is_working(true);
                                try {
                                    const configs = await get_configs();
                                    configs.selected_source_id = select_source_id();
                                    await set_configs(configs);
                                    onSuccess();
                                    onClose();

                                }catch(e){
                                    console.error(e);
                                    toast.remove();
                                    toast.error("Something went wrong while saving configs.",{style: {color:"red"}});
                                    set_is_working(false);
                                }
                                onSuccess();
                            })()}}
                        >
                            Apply
                        </Button>
                    </>

                    : <CircularProgress color='secondary'
                        size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                    />
                }   
            </div>
        </div>
    </div>)
}

