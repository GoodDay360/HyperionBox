// Tauri API


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
import { login } from "../scripts/login";

// Types Import




export default function Login(
{
    onClose = () => {},
    onSuccess = () => {},
}:{
    onClose: () => void,
    onSuccess: () => void,
}
) {
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
                        onClose();
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
                    inputProps={{ style: { color: "var(--color-1)" }, readOnly: is_loading() }}
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
                    inputProps={{ style: { color: "var(--color-1)" }, readOnly: is_loading() }}
                ></TextField>
            </div>
            
            <div class={styles.button_box}>
                <Button variant="text" color="error" disabled={is_loading()}
                    onClick={()=>{
                        onClose();
                    }}
                >Cancel</Button>
                <Button variant="contained" type="submit" disabled={is_loading()}
                >Login</Button>

            </div>
        </form>
    </div>)
}

