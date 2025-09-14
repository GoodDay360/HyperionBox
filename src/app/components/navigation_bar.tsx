// SolidJS Imports
import { For } from "solid-js"

// SolidJS Router Imports
import { useNavigate, useLocation } from "@solidjs/router";

// SUID Imports
import { IconButton, ButtonBase } from "@suid/material"


// Icon Imports
import HomeRoundedIcon from '@suid/icons-material/HomeRounded';
import HomeOutlinedIcon from '@suid/icons-material/HomeOutlined';

import FavoriteBorderRoundedIcon from '@suid/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@suid/icons-material/FavoriteRounded';

import TravelExploreOutlinedIcon from '@suid/icons-material/TravelExploreOutlined';
import TravelExploreRoundedIcon from '@suid/icons-material/TravelExploreRounded';

import SearchOutlinedIcon from '@suid/icons-material/SearchOutlined';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';

// Corvu Imports


// Style Imports
import styles from "../styles/navigation_bar.module.css"



export default function NavigationBar() {
    const navigate = useNavigate();
    const location = useLocation();



    return (<div class={styles.container_1}>
        <IconButton
            sx={{
                color: 'var(--color-1)',
                fontSize: 'calc((100vw + 100vh)/2*0.04)',
            }}
        >
            <SearchRoundedIcon fontSize="inherit" color="inherit" />
        </IconButton>
        <For each={NavigateItem}>{(item) => (
            <ButtonBase
                onClick={() => {
                    navigate(item.navigate)
                }}
                sx={{
                    textTransform: 'none',
                    color: 'var(--color-1)',
                    fontSize: 'calc((100vw + 100vh)/2*0.025)',
                    fontWeight: '400',
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
    </div>)
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