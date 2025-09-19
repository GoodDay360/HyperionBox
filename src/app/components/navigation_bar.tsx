// SolidJS Imports
import { For } from "solid-js"

// SolidJS Router Imports
import { useNavigate, useLocation } from "@solidjs/router";

// SUID Imports
import { ButtonBase } from "@suid/material"
import { BottomNavigation, BottomNavigationAction } from "@suid/material";




// Icon Imports
import HomeRoundedIcon from '@suid/icons-material/HomeRounded';
import HomeOutlinedIcon from '@suid/icons-material/HomeOutlined';

import FavoriteBorderRoundedIcon from '@suid/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@suid/icons-material/FavoriteRounded';


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
                <For each={NavigateItem}>{(item) => (
                    <BottomNavigation
                        sx={{ 
                            width: "100%",
                            height: "auto",
                            background: "var(--background-2)",
                        }}
                        value={location.pathname}
                        onChange={(_, newValue) => navigate(newValue)}
                        >
                        <BottomNavigationAction
                            label={item.label}
                            value={item.navigate}
                            sx={{
                                color: "var(--color-1)",
                                fontSize: "calc((100vw + 100vh)/2*0.0375)",
                                ".MuiBottomNavigationAction-label": {
                                    fontSize: "calc((100vw + 100vh)/2*0.0175)"
                                }
                            }}
                            
                            icon={
                                item.navigate === location.pathname 
                                ? <item.iconActive color="inherit" fontSize="inherit" /> 
                                : <item.icon color="inherit" fontSize="inherit" />
                            }
                        />
                        </BottomNavigation>
                )}</For>
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
        icon: FavoriteBorderRoundedIcon,
        iconActive: FavoriteRoundedIcon,
        label: "Profile",
        navigate: "/profile"
    }
]