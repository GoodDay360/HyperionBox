// Tauri API
import { openUrl } from '@tauri-apps/plugin-opener';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

// SolidJS Imports
import { createSignal, onMount, Index, useContext, For } from "solid-js";

// SolidJS Router Imports
// import { useNavigate } from '@solidjs/router';


// SUID Imports
import { IconButton, ButtonBase, Skeleton, MenuItem, Button, TextField } from '@suid/material';


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
import styles from "../styles/login.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';
import { pick_dir } from '@src/app/scripts/dialog';
import { 
    get_configs, set_configs, is_available_download, 
    get_storage_size, format_bytes, clean_storage
} from '../scripts/settings';
import { Configs } from '../types/settings_type';
import { login, reset_hypersync_cache, upload_all_local_favorite } from "../scripts/profile";

// Type Imports


// Media Imports
import Discord from "@src/assets/media/Discord.png";




export default function Login(
{
    onClose = () => {},
    onSuccess = () => {},
}:{
    onClose: () => void,
    onSuccess: () => void,
}
) {
    const [show_prompt_upload_local, set_show_prompt_upload_local] = createSignal(false);

    const [is_loading, set_is_loading] = createSignal(false);

    const [email, set_email] = createSignal<string>("");
    const [password, set_password] = createSignal<string>("");


    
    return (<div class={styles.container}>

        <form class={`${styles.login_box} animate__animated animate__zoomIn`}
            style={{
                "--animate-duration": "250ms",
            }}
            onSubmit={(e)=>{
                e.preventDefault();
                set_is_loading(true);
                login(email(), password())
                    .then(()=>{
                        onSuccess();
                        set_show_prompt_upload_local(true);
                        toast.remove();
                        toast.success("Logged in successfully.",{
                            style: {
                                color:"green",
                            }
                        })
                    }).catch((e)=>{
                        
                        console.error(e);
                        toast.remove();
                        toast.error(e,{
                            style: {
                                color:"red",
                            }
                        })
                    }).finally(()=>{
                        set_is_loading(false);
                    });
            }}
        >
            {show_prompt_upload_local()
                ? <>
                    <h2 class={styles.title}>Local Favorite</h2>
                    <span class={styles.text}>Do you want to upload your local<br/>favorite to HyperSync?</span>
                    <div class={styles.button_box}>
                        <Button variant="contained" color="error" type="button" disabled={is_loading()}
                            sx={{
                                color: "var(--color-1)",
                                fontSize: "calc((100vw + 100vh)/2*0.02)"
                            }}
                            onClick={()=>{
                                set_is_loading(true);
                                reset_hypersync_cache()
                                    .catch((e)=>{
                                        console.error(e);
                                    })
                                    .finally(()=>{
                                        onClose();
                                        set_is_loading(false);
                                    })
                                
                            }}
                        >NO</Button>
                        <Button variant="contained" type="button" disabled={is_loading()}
                            sx={{
                                color: "var(--color-1)",
                                fontSize: "calc((100vw + 100vh)/2*0.02)"
                            }}
                            onClick={async ()=>{
                                set_is_loading(true);
                                try{
                                    await reset_hypersync_cache();
                                    await upload_all_local_favorite();
                                    onClose();
                                }catch(e){
                                    console.error(e);
                                }
                                set_is_loading(false);
                            }}
                        >YES</Button>
                    </div>
                </>
            
                : <>
                    <h2 class={styles.title}>HyperSync</h2>
                    <div class={styles.text_field_box}>
                        <TextField label="Email" variant="filled" required
                            value={email()}
                            onChange={(e)=>{
                                set_email(e.target.value);
                            }}
                            sx={{
                                width: "100%",
                                "& .MuiInputLabel-root": {
                                    color:"var(--color-1)"
                                }
                            }}
                            inputProps={{ 
                                style: { color: "var(--color-1)" }, readOnly: is_loading(),
                                maxLength: 254,
                            }}
                        ></TextField>

                        <TextField label="Password" variant="filled" required type="password"
                            value={password()}
                            onChange={(e)=>{
                                set_password(e.target.value);
                            }}
                            sx={{
                                width: "100%",
                                "& .MuiInputLabel-root": {
                                    color:"var(--color-1)"
                                }
                            }}
                            inputProps={{ 
                                style: { color: "var(--color-1)" }, readOnly: is_loading(),
                                maxLength: 32,
                            }}
                        ></TextField>
                    </div>
                    
                    <div class={styles.button_box}>
                        <Button variant="text" color="error" type="button" disabled={is_loading()}
                            sx={{
                                fontSize: "calc((100vw + 100vh)/2*0.02)"
                            }}
                            onClick={()=>{
                                onClose();
                            }}
                        >Cancel</Button>
                        <Button variant="contained" type="submit" disabled={is_loading()}
                            sx={{
                                color: "var(--color-1)",
                                fontSize: "calc((100vw + 100vh)/2*0.02)"
                            }}
                        >Login</Button>
                    </div>

                    <div class={styles.feed_container}>
                        <span class={styles.feed_text}>Don't have account?</span>
                        <div
                            style={{
                                display: "flex",
                                "flex-direction": "row",
                                gap: "8px",
                                "align-items": "center"
                            }}
                        >
                            <span class={styles.feed_text}>Join our discord: </span>
                            <IconButton
                                onClick={() => {
                                    const url = "https://discord.com/invite/TkArvnVvNG"
                                    openUrl(url);
                                    writeText(url);
                                }}
                            >
                                <img class={styles.feed_img} src={Discord}/>
                            </IconButton>
                            

                        </div>
                    </div>
                </>
            }
        </form>
    </div>)
}

