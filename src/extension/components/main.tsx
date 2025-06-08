// React Import
import { useEffect, useState, useCallback, useContext } from "react";

// MUI Imports
import { Button } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';


// styles Import
import styles from "../styles/main.module.css";


// Lazy Load Imports

// Component Imports
import Item from "./item";

// Custom Import
import { global_context } from "../../global/scripts/contexts";
import { get_all_installed_sources } from "../../global/scripts/manage_extension";
import get_source from "../scripts/get_source";
import check_internet_connection from "../../global/scripts/check_internet_connection";

let FIRST_RUN_TIMEOUT:any;

const Extension = () => {
    // const navigate = useNavigate();
    
    const {app_ready} = useContext<any>(global_context);
    const [is_ready, set_is_ready] = useState<boolean>(false);
    const [is_online, set_is_online] = useState<boolean>(true);

    const [SOURCE_DATA, SET_SOURCE_DATA] = useState<any>({});
    const [INSTALLED_SOURCE, SET_INSTALLED_SOURCE] = useState<any>([]);
    const [SEARCH, SET_SEARCH] = useState<string>("");
    
    const get_data = async ()=>{
        set_is_ready(false);
        if (import.meta.env.DEV && import.meta.env.VITE_DEV_USE_CUSTOM_EXTENSIONS_DIRECTORY === "1"){
            set_is_online(true);
        }else{
            const check_internet_connection_result = await check_internet_connection();
            set_is_online(check_internet_connection_result);
            if (!check_internet_connection_result) {
                set_is_ready(true);
                return;
            }
        }
        

        const installed_source_result = await get_all_installed_sources();
        if (installed_source_result.code === 200) {
            SET_INSTALLED_SOURCE(installed_source_result.data);
        }

        const get_source_result = await get_source();
        if (get_source_result.code === 200) {
            SET_SOURCE_DATA(get_source_result.data);
        }else{
            SET_SOURCE_DATA([])
        }
        set_is_ready(true);
    }

    useEffect(()=>{
        if (!app_ready) return;
        clearTimeout(FIRST_RUN_TIMEOUT);
        FIRST_RUN_TIMEOUT = setTimeout(async ()=>{
            await get_data();
        }, import.meta.env.DEV ? 1500 : 0);
        return ()=>clearTimeout(FIRST_RUN_TIMEOUT)
    },[app_ready])

    const RenderItem = useCallback(({id,data}:any)=>{
        return (<Item id={id} data={data} installed={!!INSTALLED_SOURCE.some((source:any)=>source.id === id)} installed_version={INSTALLED_SOURCE.find((source:any)=>source.id === id)?.version} />)
    },[INSTALLED_SOURCE])

    return (<>
        <div className={styles.container}>
            <>{is_ready
                ? <>{is_online
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
                        <span className={styles.feedback_text}>No Internet Connection.</span>
                        <Button variant="contained"
                            onClick={async()=>{await get_data()}}
                        
                        >Retry</Button>
                    </div>
                }</>
            : <div className={styles.feedback_container}>
                
                <span className={styles.feedback_text}>Gathering info...</span>
                <CircularProgress size="max(25pt, calc((100vw + 100vh)/2 * 0.0325))" />
            </div>
            }</>
        </div>
    </>)
}

export default Extension;