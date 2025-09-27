// SolidJS Imports
import { For } from "solid-js"

// SolidJS Router Imports
import { useNavigate, useLocation } from "@solidjs/router";

// SUID Imports
import { ButtonBase } from "@suid/material"




// Icon Imports
import HomeRoundedIcon from '@suid/icons-material/HomeRounded';
import HomeOutlinedIcon from '@suid/icons-material/HomeOutlined';

import FavoriteBorderRoundedIcon from '@suid/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@suid/icons-material/FavoriteRounded';

import SettingsRoundedIcon from '@suid/icons-material/SettingsRounded';
import SettingsOutlinedIcon from '@suid/icons-material/SettingsOutlined';


// Corvu Imports


// Style Imports
import styles from "../styles/navigation_bar.module.css"



export default function NavigationBar({
    type
}:{
    type: "top" | "bottom"
}) {
    const navigate = useNavigate();
    const location = useLocation();

    

    return (<>
        <>{type === "top" &&
            <div class={styles.container_top}>
                <For each={NavigateItem}>{(item) => (
                    <ButtonBase
                        onClick={() => {
                            navigate(item.navigate)
                        }}
                        sx={{
                            textTransform: 'none',
                            color: 'var(--color-1)',
                            fontSize: 'calc((100vw + 100vh)/2*0.025)',
                            fontWeight: '500',
                            padding: '8px',
                            borderRadius: "15px",
                            paddingLeft: '18px',
                            paddingRight: '18px',
                            ...(location.pathname === item.navigate && {
                                background: 'var(--background-2)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px;"
                            } )
                        }}
                    >{item.label}</ButtonBase>
                )}</For>
            </div>
        }</>

        <>{type === "bottom" &&
            <div class={styles.container_bottom}>
                <For each={NavigateItem}>
                    {(item) => (
                        <ButtonBase
                            sx={{
                                flex:1,
                                display: 'flex',
                                flexDirection: 'column',
                                padding: "8px",
                                alignItems: 'center',
                                gap: "5px",
                            }}
                            onClick={() => {
                                navigate(item.navigate)
                            }}
                        >
                            <span class={styles.item_icon}
                                style={{
                                    background: "var(--background-1)",
                                    ...(location.pathname === item.navigate && {
                                        background: "var(--background-2)",
                                    })
                                }}
                            >
                                {location.pathname === item.navigate
                                    ? <item.iconActive color="inherit" fontSize="inherit"/>
                                    : <item.icon color="inherit" fontSize="inherit"/>
                                }
                                
                            </span>
                            
                            <span class={styles.item_label}>{item.label}</span>                        
                        </ButtonBase>
                    )}
                </For>
            </div>
        }</>
    </>)
}


const NavigateItem = [
    {
        icon: HomeOutlinedIcon,
        iconActive: HomeRoundedIcon,
        label: "Home",
        navigate: "/"
    },
    {
        icon: FavoriteBorderRoundedIcon,
        iconActive: FavoriteRoundedIcon,
        label: "Favorites",
        navigate: "/favorites"
    },
    {
        icon: SettingsOutlinedIcon,
        iconActive: SettingsRoundedIcon,
        label: "Settings",
        navigate: "/settings"
    }
]