// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

// SolidJS Imports
import { createSignal, onMount, Index, For } from "solid-js";

// SolidJS Router Imports
import { useSearchParams, useNavigate } from "@solidjs/router";


// SUID Imports
import { Button, IconButton, ButtonBase, Skeleton } from '@suid/material';

// SUID Icon Imports
import OndemandVideoRoundedIcon from '@suid/icons-material/OndemandVideoRounded';
import CloseRoundedIcon from '@suid/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@suid/icons-material/ArrowBackRounded';
import BookmarkAddOutlinedIcon from '@suid/icons-material/BookmarkAddOutlined';

// Solid Toast
import toast from 'solid-toast';



// Component Imports
import NavigationBar from "@src/app/components/navigation_bar";
import Swiper from "@src/app/components/swiper";
import LazyLoadImage from '@src/app/components/lazyloadimage';
import GridBox from '@src/app/components/grid_box';


// Style Imports
import styles from "../styles/view.module.css"


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

export default function View() {
    const navigate = useNavigate();
    
    const [show_more, set_show_more] = createSignal(false);

    return (
        <div class={styles.container}>
            <div class={styles.container_1}
                style={{
                    "background-image": `url('https://media.kitsu.app/anime/cover_images/7442/original.png')`
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
                        <img
                            class={styles.container_1_box_img}
                            src={"https://media.kitsu.app/anime/poster_images/7442/large.jpg"}
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
                                await writeText("Attach On Titan")
                                toast.success("Title copied to clipboard.",
                                    {style:{color:"green"}
                                })
                                
                            })()}}
                        
                        >{"Attach On Titan"}</h2>
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
                                // set_show_trailer({
                                //     state: true,
                                //     source: item()?.trailer?.embed_url ?? ""
                                // })
                            }}
                        >
                            <OndemandVideoRoundedIcon color='inherit' fontSize='inherit'/>
                        </IconButton>
                    </div>
                </div>


            </div>

            <div class={styles.container_2}>
                <GridBox
                    row_gap={8}
                    column_gap={8}
                >
                    <For each={[...Array(10)]}>
                        {(item, index) => (
                            <div class={styles.container_2_box}>
                                <span class={styles.container_2_box_text}>{index()}abc</span>
                            </div>
                        )}
                    </For>
                </GridBox>
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
                    >&nbsp;&nbsp;&nbsp;&nbsp;{"In the year 2071, humanity has colonized several of the planets and moons of the solar system leaving the now uninhabitable surface of planet Earth behind. The Inter Solar System Police attempts to keep peace in the galaxy, aided in part by outlaw bounty hunters, referred to as \"Cowboys\". The ragtag team aboard the spaceship Bebop are two such individuals.\nMellow and carefree Spike Spiegel is balanced by his boisterous, pragmatic partner Jet Black as the pair makes a living chasing bounties and collecting rewards. Thrown off course by the addition of new members that they meet in their travels—Ein, a genetically engineered, highly intelligent Welsh Corgi; femme fatale Faye Valentine, an enigmatic trickster with memory loss; and the strange computer whiz kid Edward Wong—the crew embarks on thrilling adventures that unravel each member's dark and mysterious past little by little. \nWell-balanced with high density action and light-hearted comedy, Cowboy Bebop is a space Western classic and an homage to the smooth and improvised music it is named after.\n\n(Source: MAL Rewrite)"}</span>
                </div>
            </div>

            <div class={styles.episode_container}>
                <div class={styles.episode_box}>
                    <For each={[...Array(10)]}>
                        {(item, index)=>(
                            <ButtonBase
                                sx={{
                                    color: "var(--color-1)",
                                    textTransform: 'none',
                                    fontSize: 'calc((100vw + 100vh)/2*0.025)',
                                    justifyContent:"flex-start",
                                    margin: 0,
                                    paddingLeft: "12px", paddingRight: "12px",
                                    paddingBottom: "5px", paddingTop: "5px",
                                    borderRadius: "8px",
                                    background: "var(--background-2)",
                                    boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                                    
                                }}
                            >
                                Episode {index()}
                            </ButtonBase>
                        )}
                    </For>
                </div>
            </div>
        </div>
    )
}

