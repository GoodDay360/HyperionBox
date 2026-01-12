// Tauri API


// SolidJS Imports
import { createSignal, onMount, For, Index } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { 
    IconButton, ButtonBase, Checkbox, TextField,
    FormControlLabel, FormGroup,
    Skeleton
} from '@suid/material';

// SUID Icon Imports
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import DriveFileRenameOutlineRoundedIcon from '@suid/icons-material/DriveFileRenameOutlineRounded';
import SaveAsRoundedIcon from '@suid/icons-material/SaveAsRounded';
import DeleteForeverRoundedIcon from '@suid/icons-material/DeleteForeverRounded';
import AddBoxRoundedIcon from '@suid/icons-material/AddBoxRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';

// Solid Toast
import toast from 'solid-toast';


// Component Imports


// Style Imports
import styles from "../styles/manage_favorite.module.css"

// Script Imports
import { 
    request_get_all_tag, request_create_tag, request_rename_tag, request_remove_tag,
    request_add_favorite, request_get_tag_from_favorite, request_remove_favorite

} from '../scripts/manage_favorite';

// Script Type Imports


export default function Plugin() {
    const navigate = useNavigate();
    const [queryParams] = useSearchParams();

    const link_from:{source: string, id:string} = {
        source: queryParams?.link_source as string ?? "", 
        id: queryParams?.link_id as string ?? ""
    };

    const [TAG_DATA, SET_TAG_DATA] = createSignal<string[]>([]);
    const [TAG_DATA_FROM_FAVORITE, SET_TAG_DATA_FROM_FAVORITE] = createSignal<string[]>([]);

    const [search, set_search] = createSignal<string>("");
    const [create_new_tag, set_create_new_tag] = createSignal<{state: boolean, value: string}>({state: false, value: ""});

    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    
    

    
    const get_data = async () => {
        set_is_loading(true);
        try{
            const [all_tag_data, tag_from_favorite] = await Promise.all([
                request_get_all_tag(), 
                request_get_tag_from_favorite(link_from.source, link_from.id)
            ]);
                
            console.log({all_tag_data})
            SET_TAG_DATA(all_tag_data);
                
            console.log("GET TAG FROM FAVORITE: ", tag_from_favorite)
            SET_TAG_DATA_FROM_FAVORITE(tag_from_favorite);
            

            set_is_loading(false);
        }catch(e){
            console.error(e);
            toast.remove();
            toast.error("Something went wrong.",{style: {color:"red"}});
        }
        
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
                <span class={styles.header_title}>Manage Favorite</span>
            </div>
            {!is_loading()
                ? <div class={styles.body_container}>
                    <div class={styles.container_1}>
                        <div class={styles.search_box}
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
                            >
                                <SearchRoundedIcon color="inherit" fontSize='inherit' />
                            </ButtonBase>
                            <input class={styles.search_input} type='text' placeholder='Search'
                                value={""}
                                onInput={(e) => {
                                    const value = e.currentTarget.value;
                                    set_search(value);
                                }}
                            /> 
                            
                        </div>
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

                                request_create_tag(value)
                                    .then(() => {
                                        toast.remove();
                                        toast.success("Tag created successfully.",{style: {color:"green"}});
                                        set_create_new_tag({state: false, value: ""});
                                        get_data();
                                    })
                                    .catch((e) => {
                                        console.error(e);
                                        toast.remove();
                                        toast.error("Something went wrong.",{style: {color:"red"}});
                                    });
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
                        <For each={TAG_DATA().filter((item) => item.toLowerCase().includes(search().toLowerCase()))}>
                            {(item)=>{
                                const [edit, set_edit] = createSignal<{state: boolean, value: string}>({state:false, value:item});
                                const [checked, set_checked] = createSignal<boolean>(TAG_DATA_FROM_FAVORITE().includes(item));
                                const [is_working, set_is_working] = createSignal<boolean>(false);
                                
                                return (<>
                                    {!edit().state &&
                                        <div class={styles.item_box}>
                                            {(link_from.source && link_from.id)
                                                ? <FormGroup
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
                                                        label={item} 
                                                        disabled={is_working()}
                                                        control={
                                                            <Checkbox  
                                                                checked={checked()}
                                                                sx={{
                                                                    color: "var(--color-1)",
                                                                }}
                                                                size='medium'
                                                            />
                                                        } 
                                                        onChange={(_, value) => {
                                                            console.log(value);
                                                            set_is_working(true);
                                                            if (value) {
                                                                request_add_favorite(item, link_from.source, link_from.id)
                                                                    .then(() => {
                                                                        set_checked(true);
                                                                        toast.remove();
                                                                        toast.success("Tag added successfully.",{style: {color:"green"}});
                                                                        
                                                                        get_data();
                                                                    })
                                                                    .catch((e) => {
                                                                        console.error(e);
                                                                        toast.remove();
                                                                        toast.error("Something went wrong.",{style: {color:"red"}});
                                                                    })
                                                                    .finally(()=>{
                                                                        set_is_working(false);
                                                                    });
                                                            }else{
                                                                request_remove_favorite(item, link_from.source, link_from.id)
                                                                    .then(() => {
                                                                        set_checked(false);
                                                                        toast.remove();
                                                                        toast.success("Removed from tag successfully.",{style: {color:"green"}});
                                                                        
                                                                        get_data();
                                                                    })
                                                                    .catch((e) => {
                                                                        console.error(e);
                                                                        toast.remove();
                                                                        toast.error("Something went wrong.",{style: {color:"red"}});
                                                                    })
                                                                    .finally(()=>{
                                                                        set_is_working(false);
                                                                    });
                                                            }
                                                        }}
                                                    />
                                                </FormGroup>
                                                : <div
                                                    style={{
                                                        flex:1,
                                                        width: "100%",
                                                        color: "var(--color-1)",
                                                        background:"var(--background-2)",
                                                        "justify-content": "center",
                                                        padding: "2.5px 12px",
                                                        "border-radius": "5px",
                                                        overflow: "hidden",
                                                        "box-sizing": "border-box",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            "font-size": "25px",
                                                            "max-width": "100%",
                                                            "white-space": "nowrap",
                                                            "text-overflow": "ellipsis",
                                                            overflow: "hidden",
                                                        }}
                                                    >{item}</span>
                                                </div>
                                            }
                                            <IconButton
                                                sx={{
                                                    color: "var(--color-1)",
                                                    fontSize: "max(25px, calc((100vw + 100vh)/2*0.0275))",
                                                }}
                                                onClick={() => {
                                                    set_edit({state:true, value:item});
                                                }}
                                            >
                                                <DriveFileRenameOutlineRoundedIcon fontSize='inherit' color='inherit' />
                                            </IconButton>
                                        </div>
                                    }
                                    {edit().state &&
                                        <form class={styles.rename_box}
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                console.log(edit().value);
                                                if (!edit().value) {
                                                    toast.remove();
                                                    toast.error("Tag name can't be empty.",{style: {color:"red"}});
                                                    return;
                                                }

                                                if (edit().value === item) {
                                                    set_edit({state:false, value:""});
                                                    return;
                                                }

                                                request_rename_tag(item, edit().value)
                                                    .then(() => {
                                                        toast.remove();
                                                        toast.success("Tag renamed successfully.",{style: {color:"green"}});
                                                        get_data();
                                                    })
                                                    .catch((e) => {
                                                        console.error(e);
                                                        toast.remove();
                                                        toast.error("Something went wrong.",{style: {color:"red"}});
                                                    })
                                                    .finally(() => {
                                                        set_edit({state:false, value:""});
                                                    })
                                                
                                            }}
                                        >
                                            <IconButton
                                                sx={{
                                                    color: "red",
                                                    fontSize: "max(25px, calc((100vw + 100vh)/2*0.0275))",
                                                }}
                                                onClick={() => {
                                                    // set_edit({state:false, value:""});
                                                    request_remove_tag(item)
                                                        .then(() => {
                                                            toast.remove();
                                                            toast.success("Tag removed successfully.",{style: {color:"green"}});
                                                            get_data();
                                                        })
                                                        .catch((e) => {
                                                            console.error(e);
                                                            toast.remove();
                                                            toast.error("Something went wrong.",{style: {color:"red"}});
                                                        })
                                                        .finally(() => {
                                                            set_edit({state:false, value:""});
                                                        })
                                                }}
                                                type="button"
                                            >
                                                <DeleteForeverRoundedIcon fontSize='inherit' color='inherit' />
                                            </IconButton>

                                            <TextField label="Rename" variant="standard" focused
                                                placeholder={item}
                                                value={edit().value}
                                                onChange={(_, value) => {
                                                    set_edit({state:true, value});
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
                : <>{/* Loading Skeleton */}
                    <div class={styles.body_container}
                        style={{
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "auto",
                                overflow: "hidden",
                                padding: "18px",
                                display: "flex",
                                "flex-direction": "column",
                                gap: "12px"
                            }}
                        >
                            <Index each={[...Array(10)]}>
                                {()=>(
                                    <Skeleton variant='rectangular'
                                        sx={{
                                            width: "100%",
                                            height: "50px",
                                            borderRadius: "5px",
                                            
                                            background: "var(--background-3)"
                                        }}
                                    />
                                )}
                            </Index>
                            
                        </div>
                    </div>
                </>
            }
            
        </div>
        
    </>)
}


