// React Import
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";

// MUI Imports
import { ButtonBase, IconButton } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// styles Import
import styles from "../styles/main.module.css";


// Lazy Load Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Custom Import
import { get_installed_sources } from "../../global/scripts/manage_extension_sources";
import write_crash_log from "../../global/scripts/write_crash_log";


const DownloadTask = () => {
    const navigate = useNavigate();
    
    return (<>
        <div className={styles.container}>
            
        </div>
    </>)
}

export default DownloadTask;