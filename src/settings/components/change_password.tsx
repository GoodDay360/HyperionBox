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
import styles from "../styles/change_password.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';
import { pick_dir } from '@src/app/scripts/dialog';
import { 
    get_configs, set_configs, is_available_download, 
    get_storage_size, format_bytes, clean_storage
} from '../scripts/settings';
import { Configs } from '../types/settings_type';
import { change_password } from "../scripts/profile";

// Type Imports


// Media Imports
import Discord from "@src/assets/media/Discord.png";




export default function ChangePassword(
{
    onClose = () => {},
    onSuccess = () => {},
}:{
    onClose: () => void,
    onSuccess: () => void,
}
) {
    const [is_loading, set_is_loading] = createSignal(false);

    const [current_password, set_current_password] = createSignal<string>("");
    const [new_password, set_new_password] = createSignal<string>("");
    
    return (<div class={styles.container}>
        <form class={`${styles.login_box} animate__animated animate__zoomIn`}
            style={{
                "--animate-duration": "250ms",
            }}
            onSubmit={(e)=>{
                e.preventDefault();
                set_is_loading(true);
                change_password(current_password(), new_password())
                    .then(()=>{
                        onSuccess();
                        onClose();
                        toast.remove();
                        toast.success("Password changed successfully.",{
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
            <h2 class={styles.title}>Change Password</h2>
            <div class={styles.text_field_box}>
                <TextField label="Current Password" variant="filled" required type="password"
                    value={current_password()}
                    onChange={(e)=>{
                        set_current_password(e.target.value);
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

                <TextField label="New Password" variant="filled" required type="password"
                    value={new_password()}
                    onChange={(e)=>{
                        set_new_password(e.target.value);
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
                <Button variant="text" color="error" disabled={is_loading()}
                    onClick={()=>{
                        onClose();
                    }}
                >Cancel</Button>
                <Button variant="contained" type="submit" disabled={is_loading()}
                >Save</Button>
            </div>
        </form>
    </div>)
}

