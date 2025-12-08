// Tauri API
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Imports
import { createSignal, onMount, For, onCleanup, createEffect, on, useContext, Index } from "solid-js";

// SolidJS Router Imports
import { useNavigate } from "@solidjs/router";


// SUID Imports
import { IconButton, ButtonBase, Skeleton } from '@suid/material';

// SUID Icon Imports
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';
import DriveFileRenameOutlineRoundedIcon from '@suid/icons-material/DriveFileRenameOutlineRounded';

// Solid Toast
import toast from 'solid-toast';


// Component Imports
import LazyLoadImage from '@src/app/components/lazyloadimage';
import NavigationBar from "@src/app/components/navigation_bar";
import GridBox from '@src/app/components/grid_box';


// Style Imports
import styles from "../styles/favorites.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';
import { request_get_all_tag, request_get_item_from_favorite } from '@src/manage_favorite/scripts/manage_favorite';
import { get_local_manifest_data } from '../scripts/favorites';
import horizontal_scroll from '@src/app/scripts/horizontal_scroll';

// Script Type Imports
import { ItemFromFavorite } from '@src/manage_favorite/types/manage_favorite_type';

export default function Favorites() {
    const navigate = useNavigate();
    
    const context = useContext(ContextManager);

    const [FAVORITE_TAG_DATA, SET_FAVORITE_TAG_DATA] = createSignal<string[]>([]);
    const [FAVORITE_ITEM_DATA, SET_FAVORITE_ITEM_DATA] = createSignal<ItemFromFavorite[]>([]);

    const [current_tag, set_current_tag] = createSignal<string>("");
    const [search, set_search] = createSignal<string>("");


    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    

    const get_data = async () => {
        set_is_loading(true);
        try{
            const all_tag_data = await request_get_all_tag()
            SET_FAVORITE_TAG_DATA(all_tag_data);
            console.log(FAVORITE_TAG_DATA())

            if (all_tag_data.length > 0) {
                if (!current_tag()) {
                    set_current_tag(all_tag_data[0]);
                }
                

                const item_from_favorite_data = await request_get_item_from_favorite(current_tag())
                console.log(item_from_favorite_data);
                SET_FAVORITE_ITEM_DATA(item_from_favorite_data);
            }
            
            set_is_loading(false);

            
        }catch(e){
            console.error(e);
            toast.remove();
            toast.error("Something went wrong.",{
                style: {
                    color:"red",
                }
            })
        }
    }
    
    

    onMount(() => {

        get_data();

    })

    createEffect(on(current_tag, () => {
        if (is_loading()) return;
        SET_FAVORITE_ITEM_DATA([]);
        get_data();

    }))

    


    return (<>
        {((context?.screen_size?.()?.width ?? 0) > 550) &&
            <div class={styles.top_navigation_bar_container}>
                <div style={{flex:1}}>
                    <NavigationBar type="top" />
                </div>
            </div>
        }

        <div class={styles.container}>

            <div class={styles.header_container}>
                <div class={`${styles.tag_container} ${["android","ios" ].includes(platform()) && "hide_scrollbar"}`}
                    onWheel={(e) => {
                        horizontal_scroll(e);
                    }}
                >
                    <For each={FAVORITE_TAG_DATA()}>
                        {(item) => (
                            
                            <ButtonBase
                                sx={{
                                    color: "var(--color-1)",
                                    fontSize: "calc((100vw + 100vh)/2*0.0275)",
                                    whiteSpace: "nowrap",
                                    padding: "12px",
                                    fontWeight: "500",
                                    textTransform: "none",
                                    ...(current_tag() === item
                                        ? {
                                            background: "var(--background-3)",
                                        }
                                        : {
                                            "&:hover": {
                                                background: "var(--background-2)",
                                            }
                                        }
                                    ),
                                    
                                }}

                                onClick={() => {
                                    set_current_tag(item);
                                }}
                            >
                                {item}
                        </ButtonBase>
                            
                        )}
                    </For>
                </div>
                <ButtonBase
                    sx={{
                        height:"100%",
                        color: 'var(--color-1)',
                        fontSize: 'calc((100vw + 100vh)/2*0.035)',
                        padding: "8px",
                    }}
                    onClick={() => {
                        navigate("/manage_favorite");
                    }}
                >
                    <DriveFileRenameOutlineRoundedIcon color="inherit" fontSize='inherit' />
                </ButtonBase>
            </div>

            <div class={styles.body_container}
                style={{
                    overflow: is_loading() ? "hidden" : "auto",
                }}
            >
                <div class={styles.top_box}>
                    <div class={styles.search_container}> 
                        <ButtonBase
                            sx={{
                                color: 'var(--color-1)',
                                fontSize: 'calc((100vw + 100vh)/2*0.035)',
                                minHeight: "100%",
                                borderTopLeftRadius: "16px",
                                borderBottomLeftRadius: "16px",
                                padding: "8px"
                            }}
                            disabled={is_loading()}
                        >
                            <SearchRoundedIcon color="inherit" fontSize='inherit' />
                        </ButtonBase>

                        <input class={styles.search_input} type='text' placeholder='Search'
                            value={search()}
                            onInput={(e) => {
                                const value = e.currentTarget.value;
                                set_search(value);
                            }}
                        /> 
                        
                    </div>

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
                <div class={styles.grid_box_container}>
                    {FAVORITE_ITEM_DATA().length > 0 &&
                    
                        <GridBox
                            row_gap={16}
                            column_gap={16}
                        >
                            {!is_loading() && 
                            <For each={FAVORITE_ITEM_DATA()}>
                                {(item) => {
                                    let REF!: HTMLDivElement;

                                    const [title, set_title] = createSignal<string>("...");
                                    const [poster, set_poster] = createSignal<string>("");
                                    
                                    const [is_in_view, set_is_in_view] = createSignal<boolean>(false);

                                    onMount(()=>{
                                        const observer = new IntersectionObserver((entries) => {
                                            entries.forEach(entry => {
                                                if (entry.isIntersecting) {
                                                    
                                                    get_local_manifest_data(item.source, item.id)
                                                        .then((data) => {
                                                            console.log(data);
                                                            set_title(data?.title ?? "?");
                                                            set_poster(data?.poster ?? "");
                                                            console.log(poster());
                                                            set_is_in_view(true);
                                                        })

                                                    observer.disconnect();
                                                }
                                            });
                                        }, {
                                            root: null,
                                            rootMargin: '0px',
                                            threshold: 0.1 // trigger when 10% of the element is visible
                                        });
                                        let interval = setInterval(() => {
                                            if (!REF) return;
                                            observer.observe(REF);
                                            clearInterval(interval);
                                        },100);
                                        

                                        onCleanup(() => {
                                            observer.disconnect();
                                        });
                                    })

                                    return (<>
                                        {is_in_view() &&
                                            (!search() ||
                                            title().trim().toLowerCase().includes(search().trim().toLowerCase()) ||
                                            item.source.trim().toLowerCase().includes(search().trim().toLowerCase()))
                                                ? <div class={styles.content_data_box}>
                                                    <ButtonBase
                                                        sx={{
                                                            width: "100%",
                                                            height: "auto",
                                                        }}
                                                        onClick={() => {
                                                            navigate(`/view?source=${item.source}&id=${item.id}`);
                                                        }}
                                                    >
                                                        <LazyLoadImage 
                                                            src={poster()}
                                                            className={styles.content_data_img}

                                                            skeleton_sx={{
                                                                width: "calc((100vw + 100vh)/2*0.18)",
                                                                height: "calc((100vw + 100vh)/2*0.25)",
                                                                background: "var(--background-2)",
                                                                borderRadius: "5px",
                                                            }}
                                                        />
                                                    </ButtonBase>
                                                    <span class={styles.content_data_title}>{title()}</span>
                                                </div>
                                                : null
                                        }
                                        {!is_in_view() &&
                                            <Skeleton variant='rectangular' ref={REF}
                                                sx={{
                                                    width: "calc((100vw + 100vh)/2*0.18)",
                                                    height: "calc((100vw + 100vh)/2*0.25)",
                                                    background: "var(--background-2)",
                                                    borderRadius: "5px",
                                                }}
                                            />
                                        }
                                    </>)
                                }}
                            </For>
                            }
                            
                            {is_loading() && 
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
                            }
                        </GridBox>
                    }

                    {FAVORITE_ITEM_DATA().length === 0 && !is_loading() &&
                        <div class={styles.no_result_box}>
                            <span class={styles.no_result_text}>No Result</span>
                        </div>
                    }
                </div>
            </div>
            
        </div>

        {((context?.screen_size?.()?.width ?? 0) <= 550) &&
            <NavigationBar type="bottom" />
        }
        
    </>)
}

