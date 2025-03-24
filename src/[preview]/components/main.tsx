// React Imports
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

// MUI Imports
import { IconButton } from "@mui/material";

// MUI Icons
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

// Styles Imports
import styles from '../styles/main.module.css';

// Custom Imports
import get_preview from "../scripts/get_preview";


const Preview = () => {
    const naviagte = useNavigate();
    const { source_id, preview_id }:any = useParams();
    const [INFO, SET_INFO] = useState<any>({});
    const [STATS, SET_STATS] = useState<any>({});
    const [EPISODE_DATA, SET_EPISODE_DATA] = useState<any>([]);
    
    const [is_loading, set_is_loading] = useState<boolean>(false);

    const is_run = useRef<boolean>(true);
    useEffect(()=>{
        if (is_run.current) return;
        is_run.current = true;
        (async () => {
            console.log(source_id,preview_id)
            const request = await get_preview({source_id,preview_id});
            console.log(request)
            if (request.code === 200) {
                SET_INFO(request.result.info);
                SET_STATS(request.result.stats);
                SET_EPISODE_DATA(request.result.episode_data);
            }
        })();
        
    },[])
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

            </div>
        </div>
        
    );
}

export default Preview;