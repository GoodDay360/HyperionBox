// React Imports
import { useEffect } from 'react';

// MUI Imports
import { IconButton, Button } from '@mui/material';


// MUI Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';


// Framer motion
import { motion } from 'framer-motion';

// Custom Imports


// Styles
import styles from "../styles/remove_download_widget.module.css";

const RemoveDownloadWidget  = ({onClose=()=>{}, onSubmit=({})=>{}}:any) => {

    useEffect(()=>{
        
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
                    <h3 className={styles.title}>Remove Download</h3>
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
                    <div className={styles.body_box_1}>
                        <span className={styles.feedback_text}>Are you sure you want to remove this from storage?</span>
                    </div>
                    <div className={styles.body_box_2}>
                        
                        <Button
                            type='submit'
                            variant='contained'
                            color='error'
                            onClick={async ()=>{
                                await onSubmit();
                                await onClose();
                            }}
                        >
                            Yes
                        </Button>
                        <Button
                            type='submit'
                            variant='outlined'
                            color='info'
                            onClick={async ()=>{
                                await onClose();
                            }}
                        >
                            No
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    </>)
}

export default RemoveDownloadWidget;