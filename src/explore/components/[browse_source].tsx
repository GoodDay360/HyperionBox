

// Tauri Plugins


// React Imports
import { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { useNavigate } from "react-router";

// Lazy Images Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// MUI Imports
import { ButtonBase, Tooltip, Button, IconButton } from '@mui/material';
import Fab from '@mui/material/Fab';
import Pagination from '@mui/material/Pagination';

// MUI Icons
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';


// Framer motion Imports


// Components Import


// Custom Imports
import styles from "../styles/browse_source.module.css";
import { global_context } from '../../global/scripts/contexts';


function BrowseSource() {
    const navigate = useNavigate();
    const {app_ready} = useContext<any>(global_context);
    const { set_menu } = useContext<any>(global_context);


    const [search, set_search] = useState<string>("");
    const [search_mode, set_search_mode] = useState<Boolean>(false)
    const [tag_data, set_tag_data] = useState<any>([]);
    const [selected_tag, set_selected_tag] = useState<string>("");
    const [DATA, SET_DATA] = useState<any>([]);
    const [max_page, set_max_page] = useState<number>(0);
    const [current_page, set_current_page] = useState<number>(1);
    const [widget, set_widget] = useState<string>("");


    const RenderItem:any = useCallback(({item}:{item:any}) => {
        
        return (<div>
            <ButtonBase className={styles.cover_box}          
                onClick={()=>{
                    navigate(`/preview/${item.source_id}/${item.preview_id}`);
                }}
            >
                <div className={styles.cover}>                
                    <LazyLoadImage 
                        style={{
                            width:"100%",
                            height:"100%",
                            objectFit:"cover",
                            borderRadius:"inherit",
                        }}
                        src={item.cover}
                    />
                </div>
                <span className={styles.cover_title}>
                    {item.title??"?"}
                </span>
                
            </ButtonBase>
        </div>)
    },[])

    return (<>
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.filter_box}>
                    <form className={styles.search_container} onSubmit={(e)=>{e.preventDefault()}}>
                        <div className={styles.search_box}>
                            <input type='text' placeholder='Search' value={search}
                                onChange={(e)=>{set_search(e.target.value)}}
                            ></input>
                        </div>
                        <IconButton color="primary" size='large' type="submit" 
                            onClick={async ()=>{
                                
                            }}
                        >
                            <SearchRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                        </IconButton>
                    </form>
                </div>
            </div>
            <>{DATA.length > 0
                ? <div className={styles.body}>
                    
                    <div className={styles.body_box_1}>
                        <>{DATA.map((item:any,index:number)=>(
                            <RenderItem key={index} item={item}/>
                        ))}</>
                        
                    </div>
                    <div className={styles.body_box_2}>
                        <Pagination count={max_page} page={current_page} color="primary" showFirstButton showLastButton
                            sx={{
                                ul: {
                                    "& .MuiPaginationItem-root": {
                                        color:"var(--color)",
                                    }
                                }
                            }}
                            onChange={async (_, page:number)=>{
                                
                            }}
                        />
                        
                    </div>
                </div>
                : <div
                    style={{
                        width:"100%",
                        height:"100%",
                        display:"flex",
                        justifyContent:"center",
                        alignItems:"center",
                        flexDirection:"column",
                        gap:"18px"
                    }}
                >
                    <span 
                        style={{
                            color:"var(--color)",
                            fontFamily:"var(--font-family-bold)",
                            fontSize: "calc((100vw + 100vh)*0.0325/2)",
                        }}
                    >Search no result.</span>
                </div>
                }
            </>
            
        </div>
    </>);
}

export default BrowseSource;
