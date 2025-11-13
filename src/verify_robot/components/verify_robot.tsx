// Tauri API


// SolidJS Imports
import { createSignal, onMount } from "solid-js";

// SolidJS Router Imports



// SUID Imports
import { Button, IconButton } from '@suid/material';

// SUID Icon Imports

import SmartToyRoundedIcon from '@suid/icons-material/SmartToyRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import AssignmentTurnedInRoundedIcon from '@suid/icons-material/AssignmentTurnedInRounded';


// Solid Toast
import toast from 'solid-toast';


// Component Imports


// Style Imports
import styles from "../styles/verify_robot.module.css"

// Script Imports



export default function VerifyRobot({
    url,
    onClose=() => {},
    onCancel=() => {},
    onDone=() => {},
    
}:{
    url: string,
    onClose: () => void,
    onCancel: () => void,
    onDone: () => void,
    
}) {
    
    const [start_verification, set_start_verification] = createSignal<boolean>(false);

    onMount(() => {
        console.log("VERIFY URL: ", url);

    })


    return (<div class={styles.container}>
        {!start_verification()
            ? 
                <div class={`${styles.verify_robot_feedback_box} animate__animated animate__zoomIn`}
                    style={{
                        "--animate-duration": "250ms",
                    }}
                >
                    <SmartToyRoundedIcon
                        sx={{
                            color: "var(--color-1)",
                            fontSize: "calc((100vw + 100vh)/2*0.065)",
                        }}
                    />
                    <span class={styles.verify_robot_feedback_title}>Robot Verification</span>
                    <span class={styles.verify_robot_feedback_text}>
                        Some plugins require robot verification to work properly before you can watch videos.<br/>
                        Would you like to start the verification process?
                    </span>
                    <div class={styles.verify_robot_feedback_button_box}>
                        
                        <Button variant='text' color="error"
                            sx={{
                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                textTransform: "none",
                                maxWidth: "fit-content",
                                minWidth: "fit-content"
                            }}
                            onClick={() => {
                                onCancel();
                            }}
                        >
                            Skip
                        </Button>

                        <Button variant='text' color="primary"
                            sx={{
                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                textTransform: "none",
                                maxWidth: "fit-content",
                                minWidth: "fit-content"
                            }}
                            onClick={() => {
                                set_start_verification(true);
                                toast.remove();
                                toast("Verification started.\nClick 'Done' when you finish the process.",{style: {color: "aqua"}});
                            }}
                        >
                            Start
                        </Button>

                    </div>
                </div>
                

            
            : <div class={styles.verify_container}>
                <div class={styles.verify_button_box}>
                    <IconButton
                        sx={{
                            color: '#ff0033',
                            fontSize: 'calc((100vw + 100vh)/2*0.035)',
                        }}
                        onClick={() => {
                            onClose();
                        }}
                    >
                        <CloseRoundedIcon color='inherit' fontSize='inherit'/>
                    </IconButton>

                    <Button variant='contained' color="secondary"
                        sx={{
                            color: "var(--color-1)",
                            fontSize: "calc((100vw + 100vh)/2*0.0225)",
                            textTransform: "none",
                            maxWidth: "fit-content",
                            minWidth: "fit-content"
                        }}
                        onClick={() => {
                            onDone();
                            onClose();
                        }}
                        startIcon={<AssignmentTurnedInRoundedIcon fontSize='inherit' color="inherit"/>}
                    >Done</Button>
                </div>
                <div class={styles.verify_iframe_box}>
                    <iframe src={url} class={styles.verify_iframe}/>
                </div>
            </div>

        }
        
    </div>)
}
