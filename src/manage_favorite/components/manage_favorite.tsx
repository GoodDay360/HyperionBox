// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Imports
import { createSignal, onMount, For, onCleanup, createEffect, on } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { 
    Button, IconButton, ButtonBase, CircularProgress, Checkbox, TextField,
    FormControlLabel, FormGroup
} from '@suid/material';

// SUID Icon Imports
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import FileDownloadRoundedIcon from '@suid/icons-material/FileDownloadRounded';
import DownloadDoneRoundedIcon from '@suid/icons-material/DownloadDoneRounded';
import RemoveDoneRoundedIcon from '@suid/icons-material/RemoveDoneRounded';
import RemoveCircleOutlineRoundedIcon from '@suid/icons-material/RemoveCircleOutlineRounded';
import UpgradeRoundedIcon from '@suid/icons-material/UpgradeRounded';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import LinkRoundedIcon from '@suid/icons-material/LinkRounded';
import DriveFileRenameOutlineRoundedIcon from '@suid/icons-material/DriveFileRenameOutlineRounded';
import CheckRoundedIcon from '@suid/icons-material/CheckRounded';
import SaveAsRoundedIcon from '@suid/icons-material/SaveAsRounded';
import DeleteForeverRoundedIcon from '@suid/icons-material/DeleteForeverRounded';
import AddRoundedIcon from '@suid/icons-material/AddRounded';
import AddBoxRoundedIcon from '@suid/icons-material/AddBoxRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';

// Solid Toast
import toast from 'solid-toast';

// Semver Imports
import semver from 'semver';

// Component Imports
import LazyLoadImage from '@src/app/components/lazyloadimage';

// Style Imports
import styles from "../styles/manage_favorite.module.css"
import { create } from 'domain';

// Script Imports

// Script Type Imports


export default function Plugin() {
    const navigate = useNavigate();
    const [queryParams] = useSearchParams();

    const link_from:{source: string, id:string, title:string} = {
        source: queryParams?.link_source as string ?? "", 
        id: queryParams?.link_id as string ?? "", 
        title: queryParams?.link_title as string ?? ""
    };

    const [create_new_tag, set_create_new_tag] = createSignal<{state: boolean, value: string}>({state: false, value: ""});


    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [is_working, set_is_working] = createSignal<boolean>(false);
    


    onMount(() => {
        set_is_loading(true);


    })

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
                <span class={styles.header_title}>Manage Favorite</span>
            </div>
            
            <div class={styles.body_container}>
                <div class={styles.container_1}>
                    <form class={styles.search_box}
                        onSubmit={(e) => {
                            e.preventDefault();
                            
                        }}
                        style={{
                            "padding-right": "12px",
                        }}
                    > 
                        <ButtonBase
                            sx={{
                                color: 'var(--color-1)',
                                fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                minHeight: "100%",
                                borderTopLeftRadius: "16px",
                                borderBottomLeftRadius: "16px",
                                padding: "8px"
                            }}
                            type='submit'
                            // disabled={is_loading()}
                        >
                            <SearchRoundedIcon color="inherit" fontSize='inherit' />
                        </ButtonBase>
                        <input class={styles.search_input} type='text' placeholder='Search'
                            value={""}
                            onInput={(e) => {
                                const value = e.currentTarget.value;
                                
                            }}
                        /> 
                        
                    </form>
                    {create_new_tag().state 
                        ? <IconButton
                            sx={{
                                color: "red",
                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.03))",
                            }}
                            onClick={() => {
                                set_create_new_tag({state: false, value: ""});
                            }}
                        >
                            <CloseRoundedIcon fontSize='inherit' color='inherit' />
                        </IconButton>
                        : <IconButton
                            sx={{
                                color: "cyan",
                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.03))",
                            }}
                            onClick={() => {
                                set_create_new_tag({state: true, value: ""});
                            }}
                        >
                            <AddBoxRoundedIcon fontSize='inherit' color='inherit' />
                        </IconButton>
                    }
                    

                    
                </div>
                {create_new_tag().state &&
                    <form class={styles.create_tag_box}
                        onSubmit={(e) => {
                            e.preventDefault();
                            let value = create_new_tag().value;
                            if (!value) {
                                toast.remove();
                                toast.error("Tag name can't be empty.",{style: {color:"red"}});
                                return;
                            };
                        }}
                    >
                        <TextField label="Create New Tag" variant="standard" focused
                            value={create_new_tag().value}
                            onChange={(_, value) => {
                                set_create_new_tag({state: true, value: value});
                            }}
                            sx={{
                                flex:1,
                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.0275))",
                                "& .MuiInput-input": {
                                    color: "var(--color-1)",
                                }
                            }}
                        />

                        <IconButton
                            sx={{
                                color: "cyan",
                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.0275))",
                            }}
                            type='submit'
                        >
                            <SaveAsRoundedIcon fontSize='inherit' color='inherit' />
                        </IconButton>
                    </form>
                }
                <div class={styles.item_container}>
                    <For each={[...Array(10)]}>
                        {(item)=>{
                            const [rename, set_rename] = createSignal<{state: boolean, value: string}>({state:false, value:""});
                            return (<>
                                {!rename().state &&
                                    <div class={styles.item_box}>
                                        <FormGroup
                                            sx={{
                                                flex:1,
                                                width: "100%",
                                                color: "var(--color-1)",
                                                background:"var(--background-2)",
                                                justifyContent: "center",
                                                padding: "2.5px 12px",
                                                borderRadius: "5px",
                                                overflow: "hidden",
                                                boxSizing: "border-box",
                                                "& .MuiFormControlLabel-label": {
                                                    fontSize: "25px",
                                                    minWidth: 0,
                                                    maxWidth: "100%",
                                                    whiteSpace: "nowrap",
                                                    textOverflow: "ellipsis",
                                                }
                                            }}
                                        >
                                            <FormControlLabel 
                                                control={
                                                    <Checkbox  
                                                        sx={{
                                                            color: "var(--color-1)",
                                                        }}
                                                        size='medium'
                                                    />
                                                } 
                                            label="Movie adsasdsadasdasdasdasdsadsadassadsadsadsadsadsaasdsadsaasdasdas" />
                                        </FormGroup>
                                        <IconButton
                                            sx={{
                                                color: "var(--color-1)",
                                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.0275))",
                                            }}
                                            onClick={() => {
                                                set_rename({state:true, value:""});
                                            }}
                                        >
                                            <DriveFileRenameOutlineRoundedIcon fontSize='inherit' color='inherit' />
                                        </IconButton>
                                    </div>
                                }
                                {rename().state &&
                                    <form class={styles.rename_box}
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            console.log(rename().value);

                                            set_rename({state:false, value:""});
                                        }}
                                    >
                                        <TextField label="Rename" variant="standard" focused
                                            placeholder='movie'
                                            value={rename().value}
                                            onChange={(_, value) => {
                                                set_rename({state:true, value});
                                            }}
                                            sx={{
                                                flex:1,
                                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.0275))",
                                                "& .MuiInput-input": {
                                                    color: "var(--color-1)",
                                                }
                                            }}
                                        />
                                        <IconButton
                                            sx={{
                                                color: "cyan",
                                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.0275))",
                                            }}
                                            type='submit'
                                        >
                                            <SaveAsRoundedIcon fontSize='inherit' color='inherit' />
                                        </IconButton>
                                    </form>
                                }
                            </>)
                        }}
                    </For>
                </div>
            </div>
            
        </div>
        
    </>)
}


