// Tauri API
import { invoke } from '@tauri-apps/api/core';


// SolidJS Imports
import { createSignal, onMount, Index, useContext } from "solid-js";

// SolidJS Router Imports



// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton, Slide } from '@suid/material';


// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';


// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import Swiper from "@src/app/components/swiper";
import LazyLoadImage from '@src/app/components/lazyloadimage';


// Style Imports
import styles from "../styles/home.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';


interface RELEVANT_CONTENT  {
    id: string,
    title: string,
    poster: string,
    banner: string,
    trailer?: {
        embed_url?: string,
        url?: string
    }
}

interface CONTENT {
    id: string,
    title: string,
    poster: string,
}

interface HOME_DATA {
    relevant_content: RELEVANT_CONTENT[]; // Replace `any` with actual type if known
    content: Record<string, CONTENT[]>;
}

export default function Home() {
    const context = useContext(ContextManager);

    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [search, set_search] = createSignal<{state:boolean, value:string}>({state:false, value:""});

    const [RELEVANT_DATA, SET_RELEVANT_DATA] = createSignal<RELEVANT_CONTENT[]>([]);
    const [CONTENT_DATA, SET_CONTENT_DATA] = createSignal<Record<string, CONTENT[]>>({});

    const [show_trailer, set_show_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});
    
    const get_data = () => {
        set_is_loading(true);
        // invoke<HOME_DATA>('home', {source:"anime"})
        //     .then((data) => {
        //         console.log(data)
        //         SET_RELEVANT_DATA(data.relevant_content);
        //         SET_CONTENT_DATA(data.content);

        //         console.table(RELEVANT_DATA())
        //         set_is_loading(false);
        //     })
        //     .catch((e) => {
        //         console.error(e);
        //         toast.remove();
        //         toast.error("Something went wrong.",{
        //             style: {
        //                 color:"red",
        //             }
        //         })
        //     });
    }

    onMount(() => {
        
        get_data();
    })
    
    return (<>
        
        <div class={styles.container}>

            {/* Manage Header Base on Screen Size for responsive */}
            {(context?.screen_size?.()?.width ?? 0) > 550  &&
                <div class={styles.header_container}>
                    <div
                        style={{
                            flex: search().state ? 0 : 1,
                            display: "flex",
                            "flex-direction": "row",
                            "justify-content": "flex-end",
                        }}
                    >
                        <IconButton
                            sx={{
                                color: search().state ? "red" : 'var(--color-1)',
                                fontSize: 'calc((100vw + 100vh)/2*0.035)'
                            }}
                            onClick={() => {
                                set_search({state:!search().state, value:""})
                            }}
                        >
                            {search().state
                                ? <CloseRoundedIcon color="inherit" fontSize='inherit' />
                                : <SearchRoundedIcon color="inherit" fontSize='inherit' />
                            }
                        </IconButton>
                    </div>
                    {search().state
                        ? <Slide in={search().state} direction='left'>
                            <form class={styles.search_container}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    console.log("SUB")
                                }}
                            > 
                                <input class={styles.search_input} type='text' placeholder='Search'/> 
                                <ButtonBase
                                    sx={{
                                        color: 'var(--color-1)',
                                        fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                        minHeight: "100%",
                                        borderTopRightRadius: "16px",
                                        borderBottomRightRadius: "16px",
                                        padding: "5px"
                                    }}
                                    type='submit'
                                >
                                    <SearchRoundedIcon color="inherit" fontSize='inherit' />
                                </ButtonBase>
                            </form>
                        </Slide>
                        : <>
                            <Slide in={!search().state} direction='left'>
                                <div
                                    style={{
                                        width: "auto",
                                        height: "auto",
                                    }}
                                >
                                    <NavigationBar type="top" />
                                </div>
                            </Slide>
                            <div
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    "flex-direction": "row",
                                    "justify-content": "flex-end",
                                }}
                            >
                                <IconButton disabled={is_loading()}
                                    sx={{
                                        color: 'var(--color-1)',
                                        fontSize: 'calc((100vw + 100vh)/2*0.035)'
                                    }}
                                    onClick={() => {
                                        get_data();
                                    }}
                                >
                                    <RefreshRoundedIcon color="inherit" fontSize='inherit' />
                                        
                                </IconButton>
                            </div>
                        </>
                    }
                </div>
            }
            
            {!is_loading() 
                ? (<>
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
                                            {item()?.trailer?.embed_url &&
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
                                                                source: item()?.trailer?.embed_url ?? ""
                                                            })
                                                        }}
                                                    >
                                                        <OndemandVideoRoundedIcon color='inherit' fontSize='inherit'/>
                                                    </IconButton>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                            </Index>
                        </Swiper>
                    </div>
                    <Index each={Object.keys(CONTENT_DATA())}>
                        {(key) => (
                            <div class={styles.content_container}>
                                <div class={styles.content_header_container}>
                                    <h2 class={styles.content_header_title}>{key()}</h2>
                                </div>
                                <div class={styles.content_data_container}
                                    onWheel={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.scrollBy({
                                            left: e.deltaY,
                                            behavior: "smooth",
                                        });
                                    }}
                                >
                                    <Index each={CONTENT_DATA()[key()]}>
                                        {(item) => <div class={styles.content_data_box}>
                                            <ButtonBase
                                                sx={{
                                                    width: "100%",
                                                    height: "auto",
                                                }}
                                            >
                                                <LazyLoadImage 
                                                    src={item().poster}
                                                    className={styles.content_data_img}

                                                    skeleton_sx={{
                                                        width: "calc((100vw + 100vh)/2*0.18)",
                                                        height: "calc((100vw + 100vh)/2*0.25)",
                                                        background: "var(--background-2)",
                                                        borderRadius: "5px",
                                                    }}
                                                />
                                            </ButtonBase>
                                            <span class={styles.content_data_title}>{item().title}</span>
                                        </div>}
                                    </Index>
                                </div>
                            </div>
                        )}
                    </Index>
                </>)

                // Loading Skeleton Component Below ↓.
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
                        <div class={styles.content_header_container}>
                            <h2 class={styles.content_header_title}>
                                <Skeleton variant='text'
                                    sx={{
                                        width: "100%",
                                        height: "36px",
                                        background: "var(--background-2)",
                                    }}
                                />
                            </h2>
                        </div>
                        
                        <div class={styles.content_data_container}
                            style={{
                                "overflow-x": "hidden",
                            }}
                        >
                            <Index each={[...Array(20)]}>
                                {(_) => <div class={styles.content_data_box}>
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
                        </div>
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

        {/* Navigation Bar For Small Screen Width */}
        {(context?.screen_size?.()?.width ?? 0) <= 550 &&
            <NavigationBar type='bottom'/>
        }
    </>)
}

