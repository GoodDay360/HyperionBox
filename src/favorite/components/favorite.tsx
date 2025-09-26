// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { platform } from '@tauri-apps/plugin-os';

// SolidJS Imports
import { createSignal, onMount, For, onCleanup, createEffect, on, useContext } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { Button, IconButton, ButtonBase, CircularProgress } from '@suid/material';

// SUID Icon Imports
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import FileDownloadRoundedIcon from '@suid/icons-material/FileDownloadRounded';
import DownloadDoneRoundedIcon from '@suid/icons-material/DownloadDoneRounded';
import RemoveDoneRoundedIcon from '@suid/icons-material/RemoveDoneRounded';
import RemoveCircleOutlineRoundedIcon from '@suid/icons-material/RemoveCircleOutlineRounded';
import UpgradeRoundedIcon from '@suid/icons-material/UpgradeRounded';
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import LinkRoundedIcon from '@suid/icons-material/LinkRounded';

// Solid Toast
import toast from 'solid-toast';

// Semver Imports
import semver from 'semver';

// Component Imports
import LazyLoadImage from '@src/app/components/lazyloadimage';
import PullRefresh from '@src/app/components/pull_refresh';
import NavigationBar from "@src/app/components/navigation_bar";

// Style Imports
import styles from "../styles/favorite.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';
import { request_get_all_tag, request_get_item_from_favorite } from '@src/manage_favorite/scripts/manage_favorite';

// Script Type Imports
import { ItemFromFavorite } from '@src/manage_favorite/types/manage_favorite_type';

export default function Favorite() {
    const navigate = useNavigate();
    const [queryParams] = useSearchParams();
    const context = useContext(ContextManager);

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();

    const [FAVORITE_TAG_DATA, SET_FAVORITE_TAG_DATA] = createSignal<string[]>([]);
    const [FAVORITE_ITEM_DATA, SET_FAVORITE_ITEM_DATA] = createSignal<ItemFromFavorite[]>([]);

    const [current_tag, set_current_tag] = createSignal<string>("");


    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [is_working, set_is_working] = createSignal<boolean>(false);
    

    const get_data = async () => {
        set_is_loading(true);
        try{
            const all_tag_data = await request_get_all_tag()
            SET_FAVORITE_TAG_DATA(all_tag_data);
            console.log(FAVORITE_TAG_DATA())

            if (all_tag_data.length > 0) {
                set_current_tag(all_tag_data[0]);

                const item_from_favorite_data = await request_get_item_from_favorite(current_tag())
                console.log(item_from_favorite_data);
                SET_FAVORITE_ITEM_DATA(item_from_favorite_data);
            }
            

            
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
        set_is_loading(true);

    }))

    


    return (<>
        {(CONTAINER_REF() && (context?.screen_size?.()?.width ?? 0) <= 550) &&
            <PullRefresh container={CONTAINER_REF() as HTMLElement}
                onRefresh={()=>{}}
            />
        }

        <div class={styles.container} ref={SET_CONTAINER_REF}>
            {((context?.screen_size?.()?.width ?? 0) > 550) &&
                <NavigationBar type="top" />
            }
            
            <div class={styles.header_container}>
                <div class={`${styles.tag_container} ${["android","ios" ].includes(platform()) && "hide_scrollbar"}`}
                    onWheel={(e) => {
                        e.preventDefault();
                        e.currentTarget.scrollBy({
                            left: e.deltaY,
                            behavior: "smooth",
                        });
                    }}
                >
                    <For each={FAVORITE_TAG_DATA()}>
                        {(item, index) => (
                            
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
            </div>
            
        </div>

        {((context?.screen_size?.()?.width ?? 0) <= 550) &&
                <NavigationBar type="bottom" />
            }
        
    </>)
}

