// React Imports
import { useEffect, useState, useRef } from 'react';

// MUI Imports
import { ButtonBase, IconButton, Tooltip, Button } from '@mui/material';
import TextField from '@mui/material/TextField';

// MUI Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

// Framer motion
import { motion, AnimatePresence } from 'framer-motion';

// Custom Imports
import {request_tag_data, request_create_tag, request_rename_tag, request_delete_tag} from '../scripts/manage_tag';

// Styles
import styles from "../styles/manage_tag_widget.module.css";

const ManageDownloadWidget  = ({onClose=()=>{}, callback=({})=>{}}:any) => {

    const isRun = useRef<boolean>(false);
    useEffect(()=>{
        if (isRun.current) return;
        isRun.current = true;
        (async () => {
            const result = await request_tag_data();
            if (result.code === 200){
                
            }
            isRun.current = false;
        })();
        return;
    },[])

    
    return (<>
        <div className={styles.container}>
            <motion.div className={styles.box}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                    hidden: { scale: 0, opacity: 0 },
                    visible: { 
                        scale: 1, 
                        opacity: 1, 
                        transition: { type: 'spring', stiffness: 175, damping: 25 } 
                    },
                    exit: { 
                        opacity: 0, 
                        transition: { duration: 0.2 } 
                    },
                }}
            >
                <div className={styles.header}>
                    <h3 className={styles.title}>Manage Download</h3>
                    <IconButton 
                        sx={{
                            background:"red", color:"var(--icon-color-1)",
                            '&:hover': {
                                background: "red"
                            }
                        }}
                        onClick={()=>{onClose()}}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                </div>
                <div className={styles.body}>

                </div>
            </motion.div>
        </div>
    </>)
}

export default ManageDownloadWidget;