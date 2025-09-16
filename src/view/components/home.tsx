// Tauri API
import { invoke } from '@tauri-apps/api/core';


// SolidJS Imports
import { createSignal, onMount, Index } from "solid-js";

// SolidJS Router Imports



// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton } from '@suid/material';

// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';


// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import Swiper from "@src/app/components/swiper";
import LazyLoadImage from '@src/app/components/lazyloadimage';
import GridBox from '@src/app/components/grid_box';


// Style Imports
import styles from "../styles/home.module.css"


interface RELEVANT_CONTENT  {
    id: string,
    title: string,
    poster: string,
    banner: string,
    trailer: {
        embed_url: string,
        url: string
    }
}

interface CONTENT {
    id: string,
    title: string,
    poster: string,
}

interface HOME_DATA {
    relevant_content: RELEVANT_CONTENT[]; // Replace `any` with actual type if known
    content: CONTENT[];
}

export default function Home() {

    const [is_loading, set_is_loading] = createSignal<boolean>(true);

    const [RELEVANT_DATA, SET_RELEVANT_DATA] = createSignal<RELEVANT_CONTENT[]>([]);
    const [CONTENT_DATA, SET_CONTENT_DATA] = createSignal<CONTENT[]>([]);

    const [show_trailer, set_show_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});
    
    onMount(() => {
        set_is_loading(true);
        
        invoke<HOME_DATA>('home', {source:"anime"})
            .then((data) => {
                console.log(data)
                SET_RELEVANT_DATA(data.relevant_content);
                SET_CONTENT_DATA(data.content);

                console.table(RELEVANT_DATA())
                set_is_loading(false);
            })
            .catch((e) => {
                console.error(e);
                toast.remove();
                toast.error("Something went wrong.",{
                    style: {
                        color:"red",
                    }
                })
            });
    })
    
    return (
        
        <div class={styles.container}>
            
            <NavigationBar />
            
            {!is_loading() 
                ? <>
                    <div class={styles.relevant_container}>
                        <Swiper
                            class={styles.relevant_swiper}
                            useNavigation={false}
                            usePagination={false}
                            slidesPerView={1}
                            AutoPlayOptions={{
                                delay: 5000
                            }}
                        >
                            <Index each={RELEVANT_DATA()}>
                                {(item) => 
                                    <div
                                        class={styles.relevant_item_container}
                                        style={{
                                            "background-image": `url('${item().banner}')`
                                        }}
                                    >
                                        <div class={styles.relevant_item_container_filter}></div>

                                        <div class={styles.relevant_info_container}>
                                            <img
                                                class={styles.relevant_img}
                                                src={item().poster}
                                            />
                                            <div
                                                style={{
                                                    flex: 1,
                                                    display:"flex",
                                                    "flex-direction":"column",
                                                    "align-items":"flex-start",
                                                    "padding-left":"16px",
                                                    overflow:"hidden"
                                                }}
                                            >
                                                <h2 class={styles.relevant_title}>{item().title}</h2>
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
                                                    "padding":"18px"
                                                }}
                                            >
                                                <IconButton
                                                    sx={{
                                                        color: '#ff0033',
                                                        fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                                    }}
                                                    onClick={() => {
                                                        set_show_trailer({
                                                            state: true,
                                                            source: item().trailer.embed_url
                                                        })
                                                    }}
                                                >
                                                    <OndemandVideoRoundedIcon color='inherit' fontSize='inherit'/>
                                                </IconButton>
                                            </div>
                                        </div>
                                        
                                    </div>
                                }
                            </Index>
                        </Swiper>
                    </div>
                    
                    <div class={styles.content_container}>
                        <GridBox
                            style={{
                                width: "100%",
                                height: "auto",
                            }}
                            row_gap={16}
                            column_gap={16}
                        >
                            <Index each={CONTENT_DATA()}>
                                {(item) => <div class={styles.content_box}>
                                    <ButtonBase
                                        sx={{
                                            width: "100%",
                                            height: "auto",
                                        }}
                                    >
                                        <LazyLoadImage 
                                            src={item().poster}
                                            className={styles.content_img}

                                            skeleton_sx={{
                                                width: "calc((100vw + 100vh)/2*0.18)",
                                                height: "calc((100vw + 100vh)/2*0.25)",
                                                background: "var(--background-2)",
                                                borderRadius: "5px",
                                            }}
                                        />
                                    </ButtonBase>
                                    <span class={styles.content_title}>{item().title}</span>
                                </div>}
                            
                            </Index>
                            

                        </GridBox>
                    </div>
                </>
                : <>
                    <div class={styles.relevant_container}>
                        <Skeleton 
                            sx={{
                                width: "100%",
                                height: "calc((100vw + 100vh)/2*0.4)",
                                background: "var(--background-2)",
                            }}
                            variant="rectangular"
                        />
                    </div>

                    <div class={styles.content_container}>
                        <GridBox
                            style={{
                                width: "100%",
                                height: "auto",
                            }}
                            row_gap={16}
                            column_gap={16}
                        >
                            <Index each={[...Array(25)]}>
                                {(_) => <div class={styles.content_box}>
                                    <Skeleton 
                                        sx={{
                                            width: "100%",
                                            height: "calc((100vw + 100vh)/2 * 0.25)",
                                            background: "var(--background-2)",
                                            borderRadius: "5px",
                                        }}
                                        variant="rectangular"
                                    />
                                    
                                    
                                </div>}
                            
                            </Index>
                            

                        </GridBox>
                    </div>
                </>
            }
            
            {show_trailer().state && 
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
                                set_show_trailer({
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
                        src={show_trailer().source} 
                        allow="autoplay; encrypted-media; fullscreen" allowfullscreen
                    >
                    </iframe>
                </div>
            }
        </div>
    )
}

