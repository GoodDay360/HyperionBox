// React Imports
import { useState } from 'react';

// MUI Imports
import { IconButton } from '@mui/material';

// MUI Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// Framer motion
import { motion } from 'framer-motion';


import styles from "../styles/create_tag_widget.module.css";

const CreateTagWidget  = ({widget, set_widget}:any) => {
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
                    <h3 className={styles.title}>Create Tag</h3>
                    <IconButton 
                        sx={{
                            background:"red", color:"var(--icon-color-1)",
                            '&:hover': {
                                background: "red"
                            }
                        }}
                        onClick={()=>{set_widget("")}}
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

export default CreateTagWidget;