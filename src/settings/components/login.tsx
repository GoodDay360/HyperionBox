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

// Types Import




export default function Login(
{
    onClose = () => {},
}:{
    onClose: () => void,
}
) {
    
    
    return (<div class={styles.container}>
        <div class={`${styles.login_box} animate__animated animate__zoomIn`}
        style={{
            "--animate-duration": "250ms",
        }}>
            <h2 class={styles.title}>HyperSync</h2>
            <div class={styles.text_field_box}>
                <TextField label="Email" variant="filled" required
                    sx={{
                        width: "100%",
                        "& .MuiInputLabel-root": {
                            color:"var(--color-1)"
                        }
                    }}
                    inputProps={{ style: { color: "var(--color-1)" } }}
                ></TextField>

                <TextField label="Password" variant="filled" required type="password"
                    sx={{
                        width: "100%",
                        "& .MuiInputLabel-root": {
                            color:"var(--color-1)"
                        }
                    }}
                    inputProps={{ style: { color: "var(--color-1)" } }}
                ></TextField>
            </div>

            <div class={styles.button_box}>
                <Button variant="text" color="error"
                    onClick={()=>{
                        onClose();
                    }}
                >Cancel</Button>
                <Button variant="contained">Login</Button>

            </div>
        </div>
    </div>)
}

