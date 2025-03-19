// React Import
import { useEffect, useState, useRef } from "react";


// MUI Imports
import { IconButton } from "@mui/material";

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

// styles Import
import styles from "../styles/main.module.css";

// Custom Import
import get_list from "../scripts/get_list";

const Explore = () => {
    const [search, set_search] = useState<string>("");

    const isRun = useRef<boolean>(false);
    useEffect(()=>{
        if (isRun.current) return;
        isRun.current = true;
        (async ()=>{
            const result = await get_list();
            console.log(result)
            isRun.current = false;
        })();
        return;
    },[])

    return (<>
        <div className={styles.container}>
            <div className={styles.header}>
                <form className={styles.search_container} onSubmit={(e)=>e.preventDefault()}>
                    <div className={styles.search_box}>
                        <input type='text' placeholder='Search' value={search} required
                            onChange={(e)=>set_search(e.target.value)}
                        />
                    </div>
                    <IconButton color="primary" size='large' type="submit"
                        onClick={()=>{
                            if (!search) return;
                        }}
                    >
                        <SearchRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                    </IconButton>
                    
                </form>
            </div>
        </div>
    </>)
}

export default Explore;