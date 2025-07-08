// React Imports
import { useEffect, useState} from 'react';

// MUI Imports
import {  IconButton, Tooltip, Button } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';


// MUI Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';


// Framer motion
import { motion } from 'framer-motion';

// Custom Imports


// Styles
import styles from "../styles/manage_download_widget.module.css";

const ManageDownloadWidget  = ({type_schema=1, onClose=()=>{}, onSubmit=({})=>{}}:any) => {

    const [quality, set_quality] = useState<number>(4);
    const [server_type, set_server_type] = useState<string>(type_schema === 1 ? "sub" : "server");

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
                    <div className={styles.body_box_1}>

                        <Tooltip placement='top' title={"Since there is no way to directly select quality due to bulk requests, quality is automatically selected based on this value during download."}>
                            <FormControl sx={{ minWidth: "200px", width:"calc((100vw + 100vh) * 0.5 / 2)"}}>
                                <InputLabel sx={{color:"var(--color)"}}>Quality</InputLabel>
                                <Select
                                    sx={{color:"var(--color)", background:"var(--background-color-layer-1)"}}
                                    labelId="demo-multiple-checkbox-label"
                                    id="demo-multiple-checkbox"
                                    value={quality}
                                    onChange={(event:any)=>{
                                        const value = event.target.value;
                                        set_quality(value);
                                    }}
                                    input={<OutlinedInput label="Quality"/>}
                                    // renderValue={(selected) => selected.join(', ')}
                                    MenuProps={{
                                        PaperProps: {
                                            style: {
                                                maxHeight: "calc((100vw + 100vh) * 0.4 / 2)",
                                                width: "calc((100vw + 100vh) * 0.3 / 2)",
                                                background:"var(--background-color-layer-1)",
                                                color:"var(--color)",
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value={4}>High</MenuItem>
                                    <MenuItem value={3}>Medium High</MenuItem>
                                    <MenuItem value={2}>Medium Low</MenuItem>
                                    <MenuItem value={1}>Low</MenuItem>
                                </Select>
                            </FormControl>
                        </Tooltip>

                        <>{type_schema === 1 &&
                            <Tooltip placement='top' title={"Select server type. This apply for all content."} >
                                <FormControl sx={{ minWidth: "200px", width:"calc((100vw + 100vh) * 0.5 / 2)"}}>
                                    <InputLabel sx={{color:"var(--color)"}}>Server Type</InputLabel>
                                    <Select
                                        sx={{color:"var(--color)", background:"var(--background-color-layer-1)"}}
                                        labelId="demo-multiple-checkbox-label"
                                        id="demo-multiple-checkbox"
                                        value={server_type}
                                        onChange={(event:any)=>{
                                            const value = event.target.value;
                                            set_server_type(value);
                                        }}
                                        input={<OutlinedInput label="Server Type"/>}
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: "calc((100vw + 100vh) * 0.4 / 2)",
                                                    width: "calc((100vw + 100vh) * 0.3 / 2)",
                                                    background:"var(--background-color-layer-1)",
                                                    color:"var(--color)",
                                                },
                                            },
                                        }}
                                    >
                                        <MenuItem value={'sub'}>SUB</MenuItem>
                                        <MenuItem value={'dub'}>DUB</MenuItem>
                                    </Select>
                                </FormControl>
                            </Tooltip>
                        }</>
                    </div>
                    <div className={styles.body_box_2}>
                        
                        <Button
                            type='submit'
                            variant='contained'
                            color='primary'
                            onClick={async ()=>{
                                await onSubmit({
                                    quality,
                                    server_type
                                })
                            }}
                        >
                            Submit
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    </>)
}

export default ManageDownloadWidget;