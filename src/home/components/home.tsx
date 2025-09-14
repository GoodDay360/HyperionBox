// Tauri API
import { invoke } from '@tauri-apps/api/core';

// SolidJS Imports
import { createSignal, onMount } from "solid-js";

// SolidJS Router Imports
import { Route } from "@solidjs/router";

// SUID Imports
import { Button, IconButton } from '@suid/material';

// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';

// Slider Imports



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import Swiper from "@src/app/components/swiper";

// Style Imports
import styles from "../styles/home.module.css"


export default function Home() {

    const [autoplay_slider, set_autoplay_slider] = createSignal(true);

    const [trailer, set_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});
    
    // onMount(() => {
    //     console.log("here");
    //     invoke('home', {source:"anime"})
    //         .then((data) => console.log(data))
    //         .catch((e) => console.error(e));
    // })
    
    return (<div class={styles.container}>
        <NavigationBar />
        
        <Swiper
            class={styles.relevent_swiper}
            useNavigation={false}
            usePagination={true}
            slidesPerView={1}
            AutoPlayOptions={{
                delay: 5000
            }}
        >
            <div
                class={styles.relevent_item_container}
                style={{
                    "background-image": "url('https://img.youtube.com/vi/gY5nDXOtv_o/maxresdefault.jpg"
                }}
            >
                <div class={styles.relevent_item_container_filter}></div>

                <div class={styles.relevent_info_container}>
                    <img
                        class={styles.relevent_img}
                        src="https://cdn.myanimelist.net/images/anime/4/19644.webp"
                    />
                    <div
                        style={{
                            flex: 1,
                            "min-height": "100%",
                            display:"flex",
                            "flex-direction":"column",
                            "align-items":"flex-start",
                            "padding-left":"16px"
                        }}
                    >
                        <h2 class={styles.relevent_title}>Dandadan 2nd Season</h2>
                        <Button
                            variant="contained" color="secondary"
                            sx={{
                                textTransform: 'none',
                                fontSize: 'calc((100vw + 100vh)/2*0.025)',
                            }}
                        >Watch Now</Button>
                    </div>

                    <div
                        style={{
                            "min-height": "100%",
                            display:"flex",
                            "align-items":"flex-end",
                            "padding":"5px"
                        }}
                    >
                        <IconButton
                            sx={{
                                color: '#ff0033',
                                fontSize: 'calc((100vw + 100vh)/2*0.035)',
                            }}
                            onClick={() => {
                                set_trailer({
                                    state: true,
                                    source: "https://www.youtube.com/embed/dwilf3OGe-A?enablejsapi=1&wmode=opaque&autoplay=1"
                                })
                            }}
                        >
                            <OndemandVideoRoundedIcon color='inherit' fontSize='inherit'/>
                        </IconButton>
                    </div>
                </div>
                
            </div>

            
        </Swiper>
        
        {trailer().state && 
            <div class={styles.trailer_container}>
                <div
                    style={{
                        width: "100%",
                        display:"flex",
                        "align-items":"center",
                        "justify-content":"flex-end",
                        "padding":"5px"
                    }}
                >
                    <IconButton
                        sx={{
                            color: '#ff0033',
                            fontSize: 'calc((100vw + 100vh)/2*0.035)',
                        }}
                        onClick={() => {
                            set_trailer({
                                state: false,
                                source: ""
                            })
                        }}
                    >
                        <CloseRoundedIcon color='inherit' fontSize='inherit'/>
                    </IconButton>
                </div>
                <iframe 
                    class={styles.trailer}
                    src={trailer().source} 
                    allow="autoplay; encrypted-media" allowfullscreen
                >
                </iframe>
            </div>
        }
    </div>)
}

