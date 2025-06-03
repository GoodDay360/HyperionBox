// React Import
import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router";

// MUI Imports
import { ButtonBase, IconButton, Tooltip } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

// styles Import
import styles from "../styles/main.module.css";


// Lazy Load Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Component Imports
import Item from "./item";

// Custom Import
import { global_context } from "../../global/scripts/contexts";
import write_crash_log from "../../global/scripts/write_crash_log";
import { get_installed_sources } from "../../global/scripts/manage_extension";
import get_source from "../scripts/get_source";


let FIRST_RUN_TIMEOUT:any;

const Extension = () => {
    const navigate = useNavigate();
    
    const {app_ready} = useContext<any>(global_context);
    const [is_ready, set_is_ready] = useState<boolean>(false);

    const [SOURCE_DATA, SET_SOURCE_DATA] = useState<any>({});
    const [INSTALLED_SOURCE, SET_INSTALLED_SOURCE] = useState<any>([]);
    const [SEARCH, SET_SEARCH] = useState<string>("");
    

    useEffect(()=>{
        if (!app_ready) return;
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            set_is_ready(false);
            const installed_source_result = await get_installed_sources();
            if (installed_source_result.code === 200) {
                SET_INSTALLED_SOURCE(installed_source_result.data.map((i:any) => i.id));
            }

            const get_source_result = await get_source();
            if (get_source_result.code === 200) {
                SET_SOURCE_DATA(get_source_result.data);
            }else{
            
            }
            set_is_ready(true);
        }, import.meta.env.DEV ? 1500 : 0);
        return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[app_ready])

    const RenderItem = useCallback(({id,data}:any)=>{
        return (<Item id={id} data={data} installed={INSTALLED_SOURCE.includes(id)} />)
    },[INSTALLED_SOURCE])

    return (<>
        <div className={styles.container}>
            <>{is_ready
                ? <>
                    <div className={styles.header}>
                        <div className={styles.search_container}>
                            <div className={styles.search_box}>
                                <SearchRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                                <input type='text' placeholder='Search' value={SEARCH} required
                                    onChange={(e)=>SET_SEARCH(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.body}>
                        <>{Object.keys(SOURCE_DATA).length > 0
                            ? <>{Object.keys(SOURCE_DATA).filter((id:any)=>{
                                if (SEARCH === "") return true;
                                else if (id.toLowerCase().includes(SEARCH.toLowerCase())) return true;
                                else if (SOURCE_DATA[id].title.toLowerCase().includes(SEARCH.toLowerCase())) return true;
                                else if (SOURCE_DATA[id].domain.toLowerCase().includes(SEARCH.toLowerCase())) return true;
                                else if (SOURCE_DATA[id].description.toLowerCase().includes(SEARCH.toLowerCase())) return true;
                                else return false
                            }).map((id:any,index:number)=>(<RenderItem key={index} id={id} data={SOURCE_DATA[id]} />))}</>
                            : <></>

                        }</>

                    </div>
                </>
            : <div className={styles.feedback_container}>
                
                <span className={styles.feedback_text}>Gathering info...</span>
                <CircularProgress size="max(25pt, calc((100vw + 100vh)/2 * 0.0325))" />

            </div>
            }</>
        </div>
    </>)
}

export default Extension;