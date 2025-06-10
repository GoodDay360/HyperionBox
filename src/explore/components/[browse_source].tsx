

// Tauri Plugins


// React Imports
import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate, useParams } from "react-router";

// Lazy Images Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// MUI Imports
import { ButtonBase, IconButton } from '@mui/material';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';


// Framer motion Imports


// Components Import


// Custom Imports
import styles from "../styles/browse_source.module.css";
import { global_context } from '../../global/scripts/contexts';
import get_list from '../scripts/get_list';

let FIRST_RUN_TIMEOUT:any;

function BrowseSource() {
    const navigate = useNavigate();
    const { source_id, search }:any = useParams();
    const {app_ready} = useContext<any>(global_context);

    const [is_ready, set_is_ready] = useState<boolean>(false);
    const [is_error, set_is_error] = useState<any>({state:false, message:""});
    const [PAGE, SET_PAGE] = useState<any>({current:1,max:1});
    const [SEARCH, SET_SEARCH] = useState<string>(search);

    const [DATA, SET_DATA] = useState<any>([]);

    const get_data = async({search,page}:{search:string,page:number})=>{
        set_is_ready(false);
        const request = await get_list({source_id:source_id, search,page});
        if (request.code === 200){
            console.log(request.result.data)
            SET_DATA(request.result.data)
            SET_PAGE({current:page,max:request.result.max_page})
        }else{
            set_is_error({state:true, message:request?.message||"Request failed."});
        }
        set_is_ready(true);
    }


    useEffect(()=>{
            if (!app_ready) return;
            clearTimeout(FIRST_RUN_TIMEOUT);
            FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
                set_is_ready(false);
                await get_data({search:SEARCH,page:PAGE.current});
            }, import.meta.env.DEV ? 1500 : 0);
            return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
        },[app_ready])

    const RenderItem:any = useCallback(({item}:{item:any}) => {
        
        return (<div>
            <ButtonBase className={styles.cover_box}          
                onClick={()=>{
                    navigate(`/preview/${source_id}/${item.id}`);
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
                    <IconButton color="primary" size='large' type="submit" 
                        onClick={async ()=>{
                            if (window.history.state && window.history.state.idx > 0) {
                                navigate(-1);
                            } else {
                                console.error("No history to go back to");
                            }
                        }}
                    >
                        <ArrowBackRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                    </IconButton>
                    <form className={styles.search_container} onSubmit={(e)=>{e.preventDefault()}}>
                        <div className={styles.search_box}>
                            <input type='text' placeholder='Search' value={SEARCH}
                                onChange={(e)=>{SET_SEARCH(e.target.value)}}
                            ></input>
                        </div>
                        <IconButton color="primary" size='large' type="submit" 
                            onClick={async ()=>{
                                if (!is_ready) return;
                                set_is_ready(false);
                                SET_PAGE({...PAGE,current:1});
                                await get_data({search:SEARCH,page:1});
                            }}
                        >
                            <>{is_ready
                                ? <SearchRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                                : <CircularProgress color="primary" size="20px"/>
                            }</>
                            
                        </IconButton>
                    </form>
                </div>
            </div>
            <>{is_ready
                ? <>{!is_error.state
                    ? <>{DATA.length > 0
                        ? <div className={styles.body}>
                            
                            <div className={styles.body_box_1}>
                                <>{DATA.map((item:any,index:number)=>(
                                    <RenderItem key={index} item={item}/>
                                ))}</>
                                
                            </div>
                            <div className={styles.body_box_2}>
                                <Pagination count={PAGE.max} page={PAGE.current} color="primary" showFirstButton showLastButton
                                    sx={{
                                        ul: {
                                            "& .MuiPaginationItem-root": {
                                                color:"var(--color)",
                                            }
                                        }
                                    }}
                                    onChange={async (_, page:number)=>{
                                        SET_PAGE({...PAGE,current:page});
                                        await get_data({search:SEARCH,page});
                                    }}
                                />
                                
                            </div>
                        </div>
                        : <div className={styles.feedback_box}>
                            <span className={styles.feedback_text}>
                                Search no result.
                            </span>
                        </div>
                        }
                    </>
                    : <div className={styles.feedback_box}>
                        <span className={styles.feedback_text}
                            style={{color:"red"}}
                        >
                            {is_error.message}
                        </span>
                    </div>
                }</>
                : <div className={styles.feedback_box}>
                    <span className={styles.feedback_text}>
                        Searching...
                    </span>
                </div>
            }</>
            
        </div>
    </>);
}

export default BrowseSource;
