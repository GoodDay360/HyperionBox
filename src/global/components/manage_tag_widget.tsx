// React Imports
import { useState } from 'react';

// MUI Imports
import { ButtonBase, IconButton, Tooltip, Button } from '@mui/material';
import TextField from '@mui/material/TextField';

// MUI Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';

// Framer motion
import { motion, AnimatePresence } from 'framer-motion';

// Custom Imports
import request_create_tag from '../script/request_create_tag';

// Styles
import styles from "../styles/manage_tag_widget.module.css";

const ManageTagWidget  = ({widget, set_widget}:any) => {
    const [create_tag, set_create_tag] = useState<any>({})
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
                    <h3 className={styles.title}>Manage Tag</h3>
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
                    <div className={styles.menu_container}>
                        <div className={styles.menu_box}>
                            <ButtonBase
                                sx={{
                                    width:"100%",
                                    color:"var(--color)",
                                    background:"var(--background-color)",
                                    padding:"12px",
                                    clipPath: 'polygon(0 0, 100% 0, calc(100% - 1em) 50%, 100% 100%, 0 100%)'
                                }}
                            >Edit</ButtonBase>
                        </div>
                    </div>
                    <div className={styles.edit_content_container}>
                        <div className={styles.edit_content_header_container}>
                            <div className={styles.edit_content_search_box}>
                                <SearchRoundedIcon sx={{color:"var(--color)"}} fontSize='medium'/>
                                <input type='text' placeholder='Search'></input>
                            </div>
                            <Tooltip title="Add tag" placement='bottom'>
                                <IconButton sx={{color:"var(--icon-color-2)"}} size="large"
                                    onClick={()=>{set_create_tag({state:true})}}
                                >
                                    <AddCircleRoundedIcon fontSize='medium'/>
                                </IconButton>
                            </Tooltip>
                        </div>
                        <div className={styles.edit_content_body_container}>
                            <AnimatePresence>
                                {create_tag.state && (
                                    <motion.form className={styles.edit_content_body_create_tag_box}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={{
                                            hidden: { scaleY: 0, transformOrigin: "top", opacity: 0 },
                                            visible: {
                                                scaleY: 1,
                                                opacity: 1,
                                                transition: {
                                                    type: "spring",
                                                    stiffness: 175,
                                                    damping: 25,
                                                    duration:0.2,
                                                },
                                            },
                                            exit: {
                                                scaleY: 0,
                                                opacity: 0,
                                                transition: {
                                                    duration: 0.2, // Adjust duration for smoother exit
                                                },
                                            },
                                        }}
                                        
                                    >
                                        <div style={{
                                            background:"var(--background-color)",
                                            width:"100%",
                                            height:"20px",
                                            borderTopLeftRadius:"inherit", borderTopRightRadius:"inherit",
                                            padding:"12px"
                                        }}>
                                            <TextField focused={true} variant='standard' label='Tag name' value={create_tag.tag_name} required
                                                sx={{
                                                    width:"100%",
                                                    input: {
                                                        color:"var(--color)",
                                                        fontFamily:"var(--font-family-regular)",
                                                    }
                                                }}
                                                onChange={(e)=>{
                                                    set_create_tag({...create_tag,tag_name:e.target.value})
                                                }}
                                            />
                                        </div>
                                        <div style={{
                                            display:"flex",
                                            background:"var(--background-color)",
                                            padding:"12px",
                                            paddingTop:"50px",
                                            justifyContent:"space-around",
                                            width:"auto",
                                            borderBottomLeftRadius:"inherit", borderBottomRightRadius:"inherit",
                                        }}>
                                            <Button variant="outlined"
                                                onClick={()=>{set_create_tag({...create_tag,state:false})}}
                                            >Cancel</Button>
                                            <Button variant='contained' type='submit'
                                                onClick={async(e)=>{
                                                    e.preventDefault()
                                                    if (!create_tag.tag_name) return
                                                    await request_create_tag({tag_name:create_tag.tag_name});
                                                    set_create_tag({...create_tag,state:false})
                                                }}
                                            >Create</Button>
                                        </div>
                                            
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </>)
}

export default ManageTagWidget;