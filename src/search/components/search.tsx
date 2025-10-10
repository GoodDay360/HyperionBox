// Tauri API
import { invoke } from '@tauri-apps/api/core';


// SolidJS Imports
import { createSignal, onMount, For, Index, useContext } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { 
    IconButton, ButtonBase, Skeleton,
} from '@suid/material';



// SUID Icon Imports
import SearchRoundedIcon from '@suid/icons-material/SearchRounded';
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';


// Solid Toast
import toast from 'solid-toast';



// Component Imports
import LazyLoadImage from '@src/app/components/lazyloadimage';
import GridBox from '@src/app/components/grid_box';
import PullRefresh from '@src/app/components/pull_refresh';


// Style Imports
import styles from "../styles/search.module.css"

// Script Imports
import { ContextManager } from '@src/app/components/app';


interface SEARCH_DATA {
    id: string,
    title: string,
    poster: string,
}


export default function Search() {
    const navigate = useNavigate();
    const [queryParams] = useSearchParams();
    const context = useContext(ContextManager);
    const source:string = queryParams?.source as string ?? ""

    const [CONTAINER_REF, SET_CONTAINER_REF] = createSignal<HTMLDivElement>();
    
    const [is_loading, set_is_loading] = createSignal<boolean>(true);
    const [is_search_change, set_is_search_change] = createSignal<boolean>(false);
    const [search, set_search] = createSignal<string>(queryParams?.search as string ?? "");
    const [is_page_max, set_is_page_max] = createSignal<boolean>(false);
    const [page, set_page] = createSignal<number>(1);

    let last_search: string = queryParams?.search as string ?? "";
    const [DATA, SET_DATA] = createSignal<SEARCH_DATA[]>([]);
    
    const check_scroll = () => {
        if (is_loading() || is_page_max()) return;
        const target = CONTAINER_REF() as HTMLDivElement;
        const threshold = 80;
        const position = target.scrollTop + target.clientHeight;
        const height = target.scrollHeight;

        if (height - position <= threshold) {
            set_page(page() + 1);
            get_data({page: page(), search: last_search});
        }
    }

    const get_data = ({page, search}:{page: number, search: string}) => {
        set_is_loading(true);
        console.log("SEARCH IS: ",{source, page, search})
        invoke<SEARCH_DATA[]>('search', {source, page, search})
            .then((data) => {
                console.log(data)
                if (data.length > 0){
                    SET_DATA([...DATA(), ...data]);
                }else{
                    set_is_page_max(true);
                }
                console.table(DATA())
            })
            .catch((e) => {
                console.error(e);
                toast.remove();
                toast.error("Something went wrong.",{
                    style: {
                        color:"red",
                    }
                })
            })
            .finally(() => {
                set_is_search_change(false);
                set_is_loading(false);
                check_scroll();
            });
    }

    

    onMount(()=>{

        (CONTAINER_REF() as HTMLDivElement).addEventListener('scroll', () => {
            check_scroll();
        });
    })

    onMount(() => {
        get_data({page: page(), search: search()});
    })
    
    return (<>
        {(CONTAINER_REF() && (context?.screen_size?.()?.width ?? 0) <= 550) &&
            <PullRefresh container={CONTAINER_REF() as HTMLElement}
                onRefresh={()=> {
                    if (is_loading() && !search()) return;
                    (document.activeElement as HTMLElement)?.blur();
                    set_is_loading(true);
                    set_is_page_max(false);
                    SET_DATA([]);
                    get_data({page: 1, search: search()});
                }}
            />
        }
        <div class={styles.container} ref={SET_CONTAINER_REF}>
            <div class={styles.header_container}>
                <IconButton
                    sx={{
                        color: "var(--color-1)",
                        fontSize: "max(25px, calc((100vw + 100vh)/2*0.035))",
                    }}
                    onClick={() => {
                        navigate(-1);
                    }}
                >
                    <ArrowBackRoundedIcon color='inherit' fontSize='inherit' />
                </IconButton>
                
                <form class={styles.search_container}
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (is_loading() && !search()) return;
                        (document.activeElement as HTMLElement)?.blur();
                        set_is_loading(true);
                        set_is_page_max(false);
                        SET_DATA([]);
                        last_search = search().trim();
                        get_data({page: 1, search: search().trim()});
                    }}
                    style={{
                        "padding-left": "12px",
                    }}
                > 
                    <input class={styles.search_input} type='text' placeholder='Search'
                        value={search()}
                        onInput={(e) => {
                            const value = e.currentTarget.value;
                            if (value.trim() === last_search) {
                                set_is_search_change(false);
                            }else{
                                set_is_search_change(true);
                            };
                            set_search(value);
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
                        disabled={is_loading()}
                    >
                        <SearchRoundedIcon color="inherit" fontSize='inherit' />
                    </ButtonBase>
                </form>
                {(context?.screen_size?.()?.width ?? 0) > 550 && 
                    <IconButton disabled={is_loading()}
                        sx={{
                            color: 'var(--color-1)',
                            fontSize: 'calc((100vw + 100vh)/2*0.035)'
                        }}
                        onClick={() => {
                            if (is_loading() && !search()) return;
                            (document.activeElement as HTMLElement)?.blur();
                            set_is_loading(true);
                            set_is_page_max(false);
                            SET_DATA([]);
                            get_data({page: 1, search: search()});
                        }}
                    >
                        <RefreshRoundedIcon color="inherit" fontSize='inherit' />
                    </IconButton>
                }
            </div>
            
            <div class={styles.grid_box_container}>
                <GridBox
                    row_gap={16}
                    column_gap={16}
                >
                    {!is_search_change() &&
                        <For each={DATA()}>
                            {(item) => (
                                <div class={styles.content_data_box}>
                                    <ButtonBase
                                        sx={{
                                            width: "100%",
                                            height: "auto",
                                        }}
                                        onClick={() => {
                                            navigate(`/view?source=${source}&id=${item.id}`);
                                        }}
                                    >
                                        <LazyLoadImage 
                                            src={item.poster}
                                            className={styles.content_data_img}

                                            skeleton_sx={{
                                                width: "calc((100vw + 100vh)/2*0.18)",
                                                height: "calc((100vw + 100vh)/2*0.25)",
                                                background: "var(--background-2)",
                                                borderRadius: "5px",
                                            }}
                                        />
                                    </ButtonBase>
                                    <span class={styles.content_data_title}>{item.title}</span>
                                </div>
                                    
                                
                            )}
                        </For>
                    }
                    {(is_loading() || is_search_change()) && 
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
            </div>
                
            
        </div>
    </>)
}

