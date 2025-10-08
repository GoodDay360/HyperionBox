// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { platform } from '@tauri-apps/plugin-os';


// SolidJS Imports
import { createSignal, onMount, For, Index, useContext } from "solid-js";

// SolidJS Router Imports
import { useNavigate } from '@solidjs/router';


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
import PullRefresh from '@src/app/components/pull_refresh';


// Style Imports
import styles from "../styles/home.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';

// Types Import
import { Content, RelevantContent, HomeData } from '../types/home_type';



export default function Home() {
    const navigate = useNavigate();
    const context = useContext(ContextManager);

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();
    

    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [search, set_search] = createSignal<string>("");
    const [search_mode, set_search_mode] = createSignal<boolean>(false);

    const [current_source, set_current_source] = createSignal<string>("movie");
    const [RELEVANT_DATA, SET_RELEVANT_DATA] = createSignal<RelevantContent[]>([]);
    const [CONTENT_DATA, SET_CONTENT_DATA] = createSignal<Content[]>([]);

    const [show_trailer, set_show_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});
    
    const get_data = () => {
        set_is_loading(true);
        invoke<HomeData>('home', {source:current_source()})
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
    }

    onMount(() => {
        
        get_data();
    })
    
    return (<>
        {(CONTAINER_REF() && (context?.screen_size?.()?.width ?? 0) <= 550) &&
            <PullRefresh container={CONTAINER_REF() as HTMLElement}
                onRefresh={get_data}
            />
        }
        <div class={styles.container} ref={SET_CONTAINER_REF}>
            {/* Manage Header Base on Screen Size for responsive */}
            {(context?.screen_size?.()?.width ?? 0) > 550
                ? <div class={styles.header_container}>
                    <div
                        style={{
                            flex: search_mode() ? 0 : 1,
                            display: "flex",
                            "flex-direction": "row",
                            "justify-content": "flex-end",
                        }}
                    >
                        <IconButton
                            sx={{
                                color: search_mode() ? "red" : 'var(--color-1)',
                                fontSize: 'calc((100vw + 100vh)/2*0.035)'
                            }}
                            onClick={() => {
                                set_search("");
                                set_search_mode(!search_mode());
                            }}
                        >
                            {search_mode()
                                ? <CloseRoundedIcon color="inherit" fontSize='inherit' />
                                : <SearchRoundedIcon color="inherit" fontSize='inherit' />
                            }
                        </IconButton>
                    </div>
                    {search_mode()
                        ? <Slide in={search_mode()} direction='left'>
                            <form class={styles.search_container}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!search()) return;
                                    navigate(`/search?source=${current_source()}&search=${encodeURIComponent(search().trim())}`);
                                }}
                                style={{
                                    "padding-left": "12px",
                                }}
                            > 
                                <input class={styles.search_input} type='text' placeholder='Search'
                                    value={search()}
                                    style={{
                                        width: "calc(var(--inner-width) * 0.4)",
                                    }}
                                    onInput={(e) => {
                                        e.preventDefault();
                                        set_search(e.target.value)
                                    }}
                                /> 
                                <ButtonBase
                                    sx={{
                                        color: 'var(--color-1)',
                                        fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                        minHeight: "100%",
                                        borderTopRightRadius: "16px",
                                        borderBottomRightRadius: "16px",
                                        padding: "8px"
                                    }}
                                    type='submit'
                                >
                                    <SearchRoundedIcon color="inherit" fontSize='inherit' />
                                </ButtonBase>
                            </form>
                        </Slide>
                        : <>
                            <Slide in={!search_mode()} direction='left'>
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
                : <div class={styles.header_container}>
                    <form class={styles.search_container}
                        style={{
                            width: "100%",
                            "padding-right": "12px",
                        }}
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!search()) return;
                            
                            navigate(`/search?search=${encodeURIComponent(search().trim())}`);
                        }}
                    > 
                        <ButtonBase
                            sx={{
                                color: 'var(--color-1)',
                                fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                minHeight: "100%",
                                borderTopLeftRadius: "16px",
                                borderBottomLeftRadius: "16px",
                                padding: "8px"
                            }}
                            type='submit' disabled={is_loading()}
                            
                        >
                            <SearchRoundedIcon color="inherit" fontSize='inherit' />
                        </ButtonBase>

                        <input 
                            class={styles.search_input} 
                            type='text' placeholder='Search'
                            value={search()}
                            style={{
                                flex: 1
                            }}
                            onInput={(e) => {
                                e.preventDefault();
                                set_search(e.target.value);
                            }}

                        /> 
                        
                    </form>
                </div>
            }
            
            {!is_loading() 
                ? (<>
                    {(RELEVANT_DATA().length > 0) &&
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
                                <For each={RELEVANT_DATA()}>
                                    {(item) => 
                                        <div
                                            class={styles.relevant_item_container}
                                            style={{
                                                "background-image": `url('${item.banner}')`
                                            }}
                                        >
                                            <div class={styles.relevant_item_container_filter}></div>

                                            <div class={styles.relevant_info_container}>
                                                <LazyLoadImage
                                                    className={styles.relevant_img}
                                                    src={item.poster}

                                                    skeleton_sx={{
                                                        width: "calc((100vw + 100vh)/2*0.18)",
                                                        height: "calc((100vw + 100vh)/2*0.25)",
                                                        background: "var(--background-2)",
                                                        borderRadius: "5px",
                                                    }}
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
                                                    <h2 class={styles.relevant_title}
                                                        onClick={() => {(async () => {
                                                            await writeText(item.title)
                                                            toast.remove();
                                                            toast.success("Title copied to clipboard.",
                                                                {style:{color:"green"}
                                                            })
                                                        })()}}
                                                    >{item.title}</h2>
                                                    <Button
                                                        variant="contained" color="secondary"
                                                        sx={{
                                                            textTransform: 'none',
                                                            fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                                        }}
                                                        onClick={() => {
                                                            navigate(`/view?source=${current_source()}&id=${item.id}`);
                                                        }}
                                                    >View Now</Button>
                                                </div>
                                                {item?.trailer?.embed_url &&
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
                                                                    source: item?.trailer?.embed_url ?? ""
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
                                </For>
                            </Swiper>
                        </div>
                    }
                    <For each={CONTENT_DATA()}>
                        {(item) => (
                            <div class={styles.content_container}>
                                <div class={styles.content_header_container}>
                                    <h2 class={styles.content_header_title}>{item.label}</h2>
                                </div>
                                <div class={`${styles.content_data_container} ${["android","ios" ].includes(platform()) && "hide_scrollbar"}`}
                                    onWheel={(e) => {
                                        const el = e.currentTarget;
                                        const hasOverflow = el.scrollWidth > el.clientWidth;
                                        if (!hasOverflow) return;

                                        e.preventDefault();
                                        e.currentTarget.scrollBy({
                                            left: e.deltaY,
                                            behavior: "smooth",
                                        });
                                    }}
                                >
                                    <For each={item.data}>
                                        {(data_item) => <div class={styles.content_data_box}>
                                            <ButtonBase
                                                sx={{
                                                    width: "100%",
                                                    height: "auto",
                                                }}
                                                onClick={() => {
                                                    navigate(`/view?source=${current_source()}&id=${data_item.id}`);
                                                }}
                                            >
                                                <LazyLoadImage 
                                                    src={data_item.poster ?? ""}
                                                    className={styles.content_data_img}

                                                    skeleton_sx={{
                                                        width: "calc((100vw + 100vh)/2*0.18)",
                                                        height: "calc((100vw + 100vh)/2*0.25)",
                                                        background: "var(--background-2)",
                                                        borderRadius: "5px",
                                                    }}
                                                />
                                            </ButtonBase>
                                            <span class={styles.content_data_title}>{data_item.title ?? "?"}</span>
                                        </div>}
                                    </For>
                                </div>
                            </div>
                        )}
                    </For>
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
            
            
        </div>

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

        {/* Navigation Bar For Small Screen Width */}
        {(context?.screen_size?.()?.width ?? 0) <= 550 &&
            <NavigationBar type='bottom'/>
        }
    </>)
}

