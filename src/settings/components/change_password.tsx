// Tauri API


// SolidJS Imports
import { createSignal } from "solid-js";

// SolidJS Router Imports
// import { useNavigate } from '@solidjs/router';


// SUID Imports
import {Button, TextField } from '@suid/material';


// SUID Icon Imports



// Solid Toast
import toast from 'solid-toast';



// Component Imports



// Style Imports
import styles from "../styles/change_password.module.css"

// Script Imports

import { change_password } from "../scripts/profile";

// Type Imports


// Media Imports





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
                >Save</Button>
            </div>
        </form>
    </div>)
}

