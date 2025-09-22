// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

// SolidJS Imports
import { createSignal, onMount, Index, For, useContext } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton, Pagination } from '@suid/material';

// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import BookmarkAddOutlinedIcon from '@suid/icons-material/BookmarkAddOutlined';
import ExtensionRoundedIcon from '@suid/icons-material/ExtensionRounded';
import AddLinkRoundedIcon from '@suid/icons-material/AddLinkRounded';

// Solid Toast
import toast from 'solid-toast';



// Component Imports
import LazyLoadImage from '@src/app/components/lazyloadimage';
import PullRefresh from '@src/app/components/pull_refresh';

// Style Imports
import styles from "../styles/view.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';


interface VIEW_DATA {
    id: string,
    title: string,
    poster: string,
    banner: string,
    description: string,

    meta_data: string[],

    trailer?: {
        embed_url?: string,
        url?: string
    },

    // Required: Season -> Episodes Page -> Episodes
    episode_list?: {
        index: number,
        id: string,
        title: string
    }[][][],
}

export default function View() {
    const navigate = useNavigate();
    const context = useContext(ContextManager);
    const [queryParams] = useSearchParams();
    const source = queryParams?.source as string ?? "";
    const id = queryParams?.id as string ?? "";

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();

    const [is_loading, set_is_loading] = createSignal<boolean>(false);

    const [DATA, SET_DATA] = createSignal<VIEW_DATA>();

    const [show_more, set_show_more] = createSignal(false);
    const [show_trailer, set_show_trailer] = createSignal<{state:boolean, source:string}>({state:false, source:""});

    const [current_season_index, _] = createSignal<number>(0);
    const [current_episode_index, set_current_episode_index] = createSignal<number>(0);


    const get_data = () => {
        set_is_loading(true);
        invoke<VIEW_DATA>('view', {source, id})
            .then((data) => {
                SET_DATA(data);
                console.table(data)
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
        {CONTAINER_REF() && (context?.screen_size?.()?.width ?? 0) > 550 &&
            <PullRefresh container={CONTAINER_REF() as HTMLElement}
                onRefresh={get_data}
            />
        }
        <div class={styles.container} ref={SET_CONTAINER_REF}
            style={{
                "overflow-y": is_loading() ? "hidden" : "auto",
            }}
        >
            {!is_loading()
                ? <>
                    <div class={styles.container_1}
                        style={{
                            "background-image": `url('${DATA()?.banner}')`
                        }}
                    >
                        {/* Below component are position absolute */}
                        <div class={styles.container_1_filter}></div>
                        <IconButton
                            sx={{
                                color: "var(--color-1)",
                                fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                                margin: "12px",
                            }}
                            onClick={() => {
                                navigate(-1);
                            }}
                        >
                            <ArrowBackRoundedIcon color='inherit' fontSize='inherit' />
                        </IconButton>
                        {/* === */}
                        
                        <div class={styles.container_1_box}>
                            <div class={styles.container_1_box_img_box}>
                                <IconButton
                                    sx={{
                                        color: 'var(--color-1)',
                                        fontSize: 'calc((100vw + 100vh)/2*0.0285)',
                                        background: 'var(--background-2)',
                                        border: "2px solid var(--background-1)",
                                        position: 'absolute',
                                        padding: '5px',
                                        bottom: 0,
                                        right: 0,
                                        margin: '5px',
                                        "&:hover": {
                                            background: 'var(--background-3)'
                                        }
                                    }}
                                >
                                    <BookmarkAddOutlinedIcon color='inherit' fontSize='inherit' />
                                </IconButton>
                                <LazyLoadImage
                                    className={styles.container_1_box_img}
                                    src={DATA()?.poster ?? ""}

                                    skeleton_sx={{
                                        width: "100%",
                                        height: "calc((100vw + 100vh)/2*0.18)",
                                        background: "calc((100vw + 100vh)/2*0.25)",
                                        borderRadius: "5px",
                                    }}
                                />
                            </div>
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
                                <h2 class={styles.container_1_box_title}
                                    onClick={() => {(async () => {
                                        await writeText(DATA()?.title ?? "");
                                        toast.remove();
                                        toast.success("Title copied to clipboard.",
                                            {style:{color:"green"}
                                        })
                                        
                                    })()}}
                                
                                >{DATA()?.title}</h2>
                                <Button
                                    variant="contained" color="secondary"
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                    }}
                                >Watch Now</Button>
                            </div>
                            {DATA()?.trailer?.embed_url && 
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
                                                source: DATA()?.trailer?.embed_url ?? ""
                                            })
                                        }}
                                    >
                                        <OndemandVideoRoundedIcon color='inherit' fontSize='inherit'/>
                                    </IconButton>
                                </div>
                            }
                        </div>


                    </div>

                    <div class={styles.container_2}>
                        <For each={DATA()?.meta_data}>
                            {(item) => (
                                <div class={styles.container_2_box}>
                                    <span class={styles.container_2_box_text}>{item[0].toUpperCase() + item.slice(1)}</span>
                                </div>
                            )}
                        </For>
                    </div>

                    <div class={styles.container_3}>
                        <div class={styles.container_3_title_box}>
                            <h2 class={styles.container_3_title}>Description</h2>
                            <Button
                                sx={{
                                    textTransform: 'none',
                                    fontSize: 'calc((100vw + 100vh)/2*0.02)',
                                    borderRadius: "calc((100vw + 100vh)/2*0.02)",
                                }}
                                onClick={() => {
                                    set_show_more(!show_more());
                                }}
                            >
                                {show_more() ? "Show Less" : "Show More"}
                            </Button>
                        </div>
                        <div class={styles.container_3_text_box}>
                            <span class={styles.container_3_text}
                                style={{
                                    ...(!show_more() && {
                                        "line-clamp": 4,
                                        "-webkit-line-clamp": 4
                                    })
                                }}
                            >&nbsp;&nbsp;&nbsp;&nbsp;{DATA()?.description}</span>
                        </div>
                    </div>

                    <div class={styles.episode_container}>
                        <div class={styles.episode_frame}>
                            <div class={styles.episode_title_box}>
                                <h2 class={styles.episode_title_box_text}>Episodes</h2>
                                {DATA()?.episode_list !== null && 
                                    <IconButton
                                        sx={{
                                            color: 'var(--color-1)',
                                            fontSize: 'calc((100vw + 100vh)/2*0.04)',
                                        }}
                                        onClick={() =>{
                                            navigate(`/plugin?link_source=${"anime"}&link_id=${DATA()?.id}&link_title=${DATA()?.title}`);
                                        }}
                                    >
                                        <AddLinkRoundedIcon fontSize='inherit' color='inherit' />
                                    </IconButton>
                                }
                                
                            </div>
                            {DATA()?.episode_list !== null
                                ? <div class={styles.episode_box}>
                                    {(DATA()?.episode_list?.length ?? 0) > 0 
                                        ? <For each={DATA()?.episode_list?.[current_season_index()]?.[current_episode_index()]}>
                                            {(item)=>(
                                                <ButtonBase
                                                    sx={{
                                                        color: "var(--color-1)",
                                                        textTransform: 'none',
                                                        fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                                        justifyContent:"flex-start",
                                                        textAlign:"left",
                                                        margin: 0,
                                                        paddingLeft: "12px", paddingRight: "12px",
                                                        paddingBottom: "5px", paddingTop: "5px",
                                                        borderRadius: "8px",
                                                        background: "var(--background-2)",
                                                        boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                                                        width: "100%",
                                                    }}
                                                >
                                                    Episode {item.index}: {item.title}
                                                </ButtonBase>
                                            )}
                                        </For>
                                            
                                        
                                        : <div class={styles.no_episode_box}>
                                            <span class={styles.no_episode_text}>No episodes found.</span>
                                        </div>
                                    }
                                </div>
                                : <div class={styles.link_plugin_box}>
                                    <Button variant='contained' color='secondary'
                                        sx={{
                                            textTransform: 'none',
                                            fontSize: 'calc((100vw + 100vh)/2 * 0.025)',
                                            color: "var(--color-1)",
                                            display: "flex",
                                            flexDirection: "row",
                                            gap: "8px",
                                        }}

                                        onClick={() => {
                                            navigate(`/plugin?link_source=${"anime"}&link_id=${DATA()?.id}&link_title=${DATA()?.title}`);
                                        }}
                                    >
                                        <ExtensionRoundedIcon color='inherit' fontSize='inherit'/> Link Plugin
                                    </Button>
                                </div>
                            }
                        </div>
                        <div class={styles.pagination_box}>
                            <Pagination 
                                color="primary" variant="outlined" showFirstButton showLastButton 
                                siblingCount={0}
                                page={current_episode_index() + 1} 
                                count={DATA()?.episode_list?.[current_season_index()]?.length ?? 0} 
                                onChange={(_, value)=> {
                                    set_current_episode_index(value - 1);
                                }}
                                size='large'
                                sx={{
                                    "& .MuiPaginationItem-root": {
                                        color: "var(--color-1)",
                                    }
                                }}
                            />
                        </div>
                    </div>
                </>
                : <> {/* Loading Skeleton */}
                    <div class={styles.skeleton_container}>
                        <Skeleton variant="rectangular"
                            sx={{
                                width: "100%",
                                height: "calc((100vw + 100vh)/2*0.45)",
                                background: "var(--background-2)",
                            }}
                        />
                        <div class={styles.skeleton_box_1}>
                            <div
                                style={{
                                    display: "flex",
                                    "flex-direction": "row",
                                    "justify-content": "flex-start",
                                    gap: "8px",
                                }}
                            >
                                <Index each={[...Array(4)]}>
                                    {(_) =>
                                        <Skeleton variant="rectangular"
                                            sx={{
                                                flex: 1,
                                                height: "40px",
                                                background: "var(--background-2)",
                                            }}
                                        />
                                    }
                                </Index>
                            </div>
                            <Skeleton variant="rectangular"
                                sx={{
                                    width: "100%",
                                    height: "100px",
                                    background: "var(--background-2)",
                                }}
                            />
                        </div>

                        
                        
                        <div class={styles.episode_container}>
                            <div class={styles.episode_frame}
                                style={{
                                    height: "auto"
                                }}
                            >
                                <div class={styles.episode_title_box}>
                                    <Skeleton variant="text"
                                        sx={{
                                            width: "100%",
                                            height: "40px",
                                            background: "var(--background-2)",
                                        }}
                                    />
                                </div>
                                <div class={styles.episode_box}
                                    style={{
                                        padding: "12px",
                                        height: "auto"
                                    }}
                                >
                                    <Index each={[...Array(12)]}>
                                        {(_) =>
                                            <Skeleton variant="rectangular"
                                                sx={{
                                                    width: "100%",
                                                    height: "40px",
                                                    background: "var(--background-2)",
                                                }}
                                            />
                                        }
                                    </Index>
                                </div>
                                    
                            </div>
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
    </>)
}

