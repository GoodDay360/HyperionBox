// Tauri Imports
import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Import



// SUID Imports
import { ButtonBase } from '@suid/material';

// SUID Icons
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import CropSquareRoundedIcon from '@suid/icons-material/CropSquareRounded';
import MinimizeRoundedIcon from '@suid/icons-material/MinimizeRounded';

// Style Imports
import styles from "../styles/titlebar.module.css"
import type { Accessor } from 'solid-js';

// Script Imports


export default function TitleBar({
    ref,
    title
}:{
    ref?: HTMLElement
    title?: Accessor<string>
}) {
    const appWindow = getCurrentWindow();
    

    return (<>{["linux", "macos", "windows"].includes(platform()) && (
        <div ref={ref as HTMLDivElement} class={styles.titlebar_container}>   
            <div class={styles.titlebar_draggable}
                onMouseDown={async (e)=> {
                    e.preventDefault();
                    if (await appWindow.isFullscreen()) return;
                    if (e.buttons === 1) {
                        // Primary (left) button
                        if (e.detail === 2){
                            await appWindow.toggleMaximize();
                        }else{
                            appWindow.startDragging();
                        }
                    }
                }}
            >
                <span
                    class={styles.titlebar_title}
                >{title?.() ?? "HyperionBox"}</span>
            </div>
            
            
            <div class={styles.titlebar_buttons}>
                <ButtonBase
                    sx={{
                        color:"gray",
                        borderRadius: 0,
                        padding: "8px",
                        fontSize: "16px",
                    }}
                    onClick={()=> appWindow.minimize()}
                >
                    <MinimizeRoundedIcon color='inherit' fontSize='inherit'/>
                </ButtonBase>

                <ButtonBase
                    sx={{
                        color:"gray",
                        borderRadius: 0,
                        padding: "8px",
                        fontSize: "16px",
                    }}

                    onClick={async ()=> {
                        if (await appWindow.isFullscreen()){
                            appWindow.setFullscreen(false);
                        }else{
                            appWindow.setFullscreen(true);
                        }
                        
                    }}
                >
                    <CropSquareRoundedIcon color='inherit' fontSize='inherit'/>
                </ButtonBase>


                <ButtonBase
                    sx={{
                        color:"red",
                        borderRadius: 0,
                        padding: "8px",
                        fontSize: "16px",
                    }}
                    onClick={()=> appWindow.close()}
                >
                    <CloseRoundedIcon color='inherit' fontSize='inherit'/>
                </ButtonBase>
            </div>
        </div>
    )}</>)
}
