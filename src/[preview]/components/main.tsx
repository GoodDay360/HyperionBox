// React Imports
import { useEffect, useRef, useState, Fragment, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router";

// MUI Imports
import { ButtonBase, IconButton, Button } from "@mui/material";
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import Pagination from '@mui/material/Pagination';

// MUI Icons
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

// Styles Imports
import styles from '../styles/main.module.css';
import randomColor from "randomcolor";
// Custom Imports
import get_preview from "../scripts/get_preview";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { request_tag_data } from "../../global/scripts/manage_tag";



const Preview = () => {
    const naviagte = useNavigate();
    const { source_id, preview_id }:any = useParams();
    const [TAG_DATA, SET_TAG_DATA] = useState<any>([])
    const [INFO, SET_INFO] = useState<any>({});
    const [STATS, SET_STATS] = useState<any>({});
    const [EPISODE_DATA, SET_EPISODE_DATA] = useState<any>([]);
    
    const [is_loading, set_is_loading] = useState<boolean>(false);

    const [selected_tag, set_selected_tag] = useState<any>([]);
    const [show_more_info, set_show_more_info] = useState<boolean>(false)
    const [current_page, set_current_page] = useState<number>(1);


    const is_run = useRef<boolean>(false);
    useEffect(()=>{
        if (is_run.current) return;
        is_run.current = true;
        (async () => {
            console.log(source_id,preview_id)
            const request_tag_data_result = await request_tag_data()
            console.log(request_tag_data_result)
            if (request_tag_data_result.code === 200){
                SET_TAG_DATA(request_tag_data_result.data)
            }

            const request_preview_result = await get_preview({source_id,preview_id});
            console.log(request_preview_result)
            if (request_preview_result.code === 200) {
                SET_INFO(request_preview_result.result.info);
                SET_STATS(request_preview_result.result.stats);
                SET_EPISODE_DATA(request_preview_result.result.episodes);
            }
        })();
        
    },[])

    const TAG_BOX_COMPONENT = useCallback(({item_key}:any)=>{
        const bg_color = useMemo(()=>randomColor({luminosity:"bright",format: 'rgba',alpha:0.8}),[STATS])
        return (
            <div className={styles.stats_box} 
                style={{
                    background: bg_color,
                }}
            >
                <span className={styles.stats_text}>
                    <>{["sub","dub","eps"].includes(item_key)
                        ? <>
                            {item_key === "sub" && `SUB: ${STATS[item_key] }`}
                            {item_key === "dub" && `DUB: ${STATS[item_key] }`}
                            {item_key === "eps" && `EPS: ${STATS[item_key] }`}
                        </>
                        : <>{STATS[item_key]}</>
                    }</>
                </span>
            </div>
        )
    },[STATS])

    const EPISODE_BOX_COMPONENT = useCallback(({item_key}:any)=>{
        
    },[EPISODE_DATA])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <IconButton color="primary" size="large">
                    <ArrowBackRoundedIcon sx={{color:"var(--icon-color-1)"}} fontSize="large"/>
                </IconButton>
                <IconButton color="primary" size="large">
                    <DownloadRoundedIcon sx={{color:"var(--icon-color-1)"}} fontSize="large"/>
                </IconButton>
            </div>
            <div className={styles.body}>
                <div className={styles.body_box_1}>
                    <div
                        style={{
                            width:"auto",
                            height:"auto",
                            display:"flex",
                            flexDirection:"column",
                            gap:"12px",
                            boxSizing:"border-box",
                        }}
                    >
                        <div
                            style={{
                                width: "calc((100vw + 100vh) * 0.2 / 2)",
                                height: "calc((100vw + 100vh) * 0.275 / 2)",
                                background:"green",
                                borderRadius:"8px",
                                boxShadow:  "rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px",
                                boxSizing:"border-box",
                            }}
                        >
                            <LazyLoadImage
                                style={{width:"100%",height:"100%",borderRadius:"inherit"}}
                                src={INFO.cover}
                            />
                            <div className={styles.cover_overlay}>
                                <div
                                    style={{
                                        width:"auto",
                                        height:"auto",
                                        background:"var(--icon-color-2)",
                                        padding: "4px",
                                        borderRadius:"6px",
                                        display:"flex",
                                        alignItems:'center',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily:"var(--font-family-medium)",
                                            color:"var(--color)",
                                            fontSize:"calc((100vw + 100vh) * 0.0225 / 2)",
                                        }}
                                    >00:25:00</span>
                                </div>
                            </div>
                        </div>
                        
                        <FormControl sx={{ maxWidth: "calc((100vw + 100vh) * 0.2 / 2)"}}>
                            <InputLabel sx={{color:"var(--color)"}}>Watchlist</InputLabel>
                            <Select
                                sx={{color:"var(--color)", background:"var(--background-color-layer-1)"}}
                                labelId="demo-multiple-checkbox-label"
                                id="demo-multiple-checkbox"
                                multiple
                                value={selected_tag}
                                onChange={(event:any)=>{
                                    const {target: { value }} = event;
                                    set_selected_tag(typeof value === 'string' ? value.split(',') : value)}
                                }
                                input={<OutlinedInput label="Watchlist"/>}
                                renderValue={(selected) => selected.join(', ')}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: "calc((100vw + 100vh) * 0.4 / 2)",
                                            width: "calc((100vw + 100vh) * 0.3 / 2)",
                                            background:"var(--background-color-layer-1)",
                                            color:"var(--color)",
                                        },
                                    },
                                }}
                            >
                                {TAG_DATA.map((tag:string,index:number) => (
                                    <MenuItem key={index} value={tag}>
                                        <Checkbox checked={selected_tag.includes(tag)} sx={{color:"var(--color)"}}/>
                                        <ListItemText primary={tag} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                    </div>
                    <div
                        style={{
                            display:"flex",
                            flex:1,
                            background:"var(--background-color)",
                            flexDirection:"column",
                            boxSizing: "border-box",
                            gap:"12px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily:"var(--font-family-bold)",
                                color:"var(--color)",
                                fontSize:"calc((100vw + 100vh) * 0.0325 / 2)",
                                wordBreak:"break-word",
                            }}
                        >{INFO.title}</span>

                        {/* Stats container */}
                        <div className={styles.stats_container}>
                            <div className={styles.stats_box} 
                                style={{
                                    background: useRef(randomColor({luminosity:"bright",format: 'rgba',alpha:0.8})).current
                                }}
                            >
                                <span className={styles.stats_text}>
                                    SOURCE: {source_id}
                                </span>
                            </div>
                            
                            <>{Object.keys(STATS).map((item_key,index)=>(
                                <TAG_BOX_COMPONENT item_key={item_key} key={index}/>
                            ))}</>
                        </div>
                        {/* ============= */}

                        <div
                            style={{
                                display:"flex",
                                width:"100%",
                                alignItems:"center",
                                justifyContent:"flex-start",
                                paddingTop:"calc((100vw + 100vh) * 0.025/2)"
                            }}
                        >
                            <ButtonBase
                                sx={{
                                    background:"var(--background-color-layer-1)",
                                    color:"var(--color)",
                                    display:"flex",
                                    flexDirection:"column",
                                    justifyContent:"center",
                                    width:"calc((100vw + 100vh) * 0.35/2)",
                                    borderRadius:"18px",
                                    padding:"4px",
                                    boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                                    fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                }}
                            >
                                <span style={{fontFamily: "var(--font-family-bold)"}}>Continues</span>
                                <span style={{fontFamily: "var(--font-family-light)"}}>Episode: 1</span>
                            </ButtonBase>
                        </div>
                    </div>
                </div>
                <div className={styles.body_box_2}
                    style={{
                        height: show_more_info ? "auto" : "calc((100vw + 100vh) * 0.25 / 2)",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            display:"flex",
                            flexDirection:"row",
                            justifyContent:"space-between",
                            
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-family-bold)",
                                color: "var(--color)",
                                fontSize: "calc((100vw + 100vh) * 0.025 / 2)",
                            }}
                        >Description:</span>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{
                                borderRadius:"12px",
                                color:"var(--color)",
                                fontFamily: "var(--font-family-medium)",
                                fontSize: "calc((100vw + 100vh) * 0.0125 / 2)",
                            }}
                            onClick={()=>{set_show_more_info(!show_more_info)}}
                        >
                            {show_more_info ? "show less" : "show more"}
                        </Button>
                    </div>
                    <div
                        style={{
                            borderBottom: "2px solid var(--background-color-layer-1)",
                            paddingBottom: "12px",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "var(--font-family-regular)",
                                color: "var(--color)",
                                fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                wordBreak:"break-word",
                            }}
                        >{INFO.description}</span>
                    </div>
                    <div
                        style={{
                            display:"flex",
                            flexDirection:"column",
                            gap:"8px",
                        }}
                    >
                        <>{Object.keys(INFO).map((item_key:string,index:number)=>(<Fragment key={index}>
                            <>{!["cover","description", "title"].includes(item_key) && (
                                <span
                                    style={{
                                        fontFamily: "var(--font-family-regular)",
                                        color: "var(--color)",
                                        fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                        wordBreak:"break-word",
                                    }}
                                ><span style={{fontFamily: "var(--font-family-bold)"}}>{item_key[0].toUpperCase() + item_key.slice(1)}:</span> {INFO[item_key]}</span>
                            )}</>
                        </Fragment>))
                        }</>
                    </div>

                </div>
                <div className={styles.body_box_3}>
                    <>{EPISODE_DATA?.length 
                        ? <>{EPISODE_DATA[current_page-1].map((item:any,index:number)=>(<Fragment key={index}>
                            <ButtonBase
                                style={{
                                    borderRadius:"12px",
                                    background:"var(--background-color)",
                                    color:"var(--color)",
                                    display:"flex",
                                    alignItems:"center",
                                    justifyContent:"flex-start",
                                    padding:"12px",
                                    border:"2px solid var(--background-color-layer-1)",
                                    fontFamily: "var(--font-family-medium)",
                                    fontSize: "calc((100vw + 100vh) * 0.02 / 2)",
                                }}
                            >
                                <span><span style={{fontFamily: "var(--font-family-bold)"}}>Episode {item.ep}: </span>{item.title}</span>
                            </ButtonBase>
                        </Fragment>))}</>
                        : <></>
                    }</>
                </div>
                <div className={styles.body_box_4}>
                    <Pagination count={EPISODE_DATA.length} page={current_page} color="primary" showFirstButton showLastButton
                        sx={{
                            ul: {
                                "& .MuiPaginationItem-root": {
                                    color:"var(--color)",
                                }
                            }
                        }}
                        onChange={(event, page:number)=>{set_current_page(page)}}
                    />
                    
                </div>
            </div>
        </div>
        
    );
}

export default Preview;