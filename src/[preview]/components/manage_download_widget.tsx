// React Imports
import { useEffect, useState, useContext} from 'react';



// MUI Imports
import {  IconButton, Tooltip, Button } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InputRoundedIcon from '@mui/icons-material/InputRounded';

// Custom MUI
import { CustomFormControlSelect } from './custom_mui';

// Framer motion
import { motion } from 'framer-motion';

// Custom Imports
import { global_context } from '../../global/scripts/contexts';
import get_watch from '../../[watch]/scripts/get_watch';

// Styles
import styles from "../styles/manage_download_widget.module.css";

const ManageDownloadWidget  = ({source_id, preview_id, season_id, server_type_schema=1, selected_data=[], onClose=()=>{}, onSubmit=({})=>{}}:any) => {

    const [quality, set_quality] = useState<number>(4);
    const [server_type, set_server_type] = useState<string>(server_type_schema === 1 ? "sub" : "server");

    const [PREFER_SERVER_LIST, SET_PREFER_SERVER_LIST] = useState<any>({});
    const [precise_mode, set_precise_mode] = useState<boolean>(false);
    const [selected_precise_server_type, set_selected_precise_server_type] = useState<string>("");
    const [selected_precise_server_id, set_selected_precise_server_id] = useState<string>("");

    const [is_managing, set_is_managing] = useState<boolean>(false);

    const {set_feedback_snackbar} = useContext<any>(global_context);

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
                    <IconButton disabled={is_managing}
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
                <form className={styles.body}
                    onSubmit={async (event)=>{
                        event.preventDefault();
                        set_is_managing(true);
                        if (precise_mode) {
                            if (!selected_precise_server_type || !selected_precise_server_id) {
                                set_feedback_snackbar({state:true, type:"error" ,text:"Missing select options."});
                                set_is_managing(false);
                            }else{
                                await onSubmit({
                                    quality,
                                    server_type: selected_precise_server_type,
                                    server_id: selected_precise_server_id
                                })
                            }
                            
                        }else{
                            await onSubmit({
                                quality,
                                server_type
                            })
                        }
                        
                        set_is_managing(false);
                    }}
                >
                    <div className={styles.body_box_1}>

                        <Tooltip placement='top' title={"Since there is no way to directly select quality due to bulk requests, quality is automatically selected based on this value during download."}>
                            <CustomFormControlSelect required={true}
                                label='Quality'
                                value={quality}
                                onChange={(event:any)=>{
                                    const value = event.target.value;
                                    set_quality(value);
                                }}
                                MenuItemComponents={[
                                    <MenuItem key={1} value={4}>High</MenuItem>,
                                    <MenuItem key={2} value={3}>Medium High</MenuItem>,
                                    <MenuItem key={3} value={2}>Medium Low</MenuItem>,
                                    <MenuItem key={4} value={1}>Low</MenuItem>,
                                ]}
                            />
                        </Tooltip>

                        <>{precise_mode
                            ? <>
                                <Tooltip placement='top' title={"Select server type. This apply for all content."} >
                                    <CustomFormControlSelect required={true}
                                        label='Prefer Server Type'
                                        value={selected_precise_server_type}
                                        onChange={(event:any)=>{
                                            const value = event.target.value;
                                            set_selected_precise_server_type(value);
                                        }}
                                        MenuItemComponents={Object.keys(PREFER_SERVER_LIST).map((item:string,index:number) => <MenuItem key={index} value={item}>{item.toUpperCase()}</MenuItem>)}
                                    />
                                </Tooltip>
                                
                                <>{selected_precise_server_type &&
                                    <Tooltip placement='top' title={"Select server ID. This apply for all content."} >
                                        <CustomFormControlSelect required={true}
                                            label='Prefer Server ID'
                                            value={selected_precise_server_id}
                                            onChange={(event:any)=>{
                                                const value = event.target.value;
                                                set_selected_precise_server_id(value);
                                            }}
                                            MenuItemComponents={PREFER_SERVER_LIST[selected_precise_server_type].map((item:any,index:number) => <MenuItem key={index} value={item.server_id}>{item.title}</MenuItem>)}
                                        />
                                    </Tooltip>
                                }</>
                            </>
                            : <>{server_type_schema === 1 &&
                                
                                <Tooltip placement='top' title={"Select server type. This apply for all content."} >
                                    <CustomFormControlSelect required={true}
                                        label='Prefer Server Type'
                                        value={server_type}
                                        onChange={(event:any)=>{
                                            const value = event.target.value;
                                            set_server_type(value);
                                        }}
                                        MenuItemComponents={[
                                            <MenuItem key={1} value={'sub'}>SUB</MenuItem>,
                                            <MenuItem key={2} value={'dub'}>DUB</MenuItem>
                                        ]}
                                    />
                                </Tooltip>
                            }</>
                        }</>
                    </div>
                    <div className={styles.body_box_2}>
                        <>{is_managing
                            ? <CircularProgress color='secondary' size="calc((100vw + 100vh)*0.035/2)" />
                            : <>
                                <Tooltip title={"Request more precise preferable information."}>
                                    <IconButton
                                        onClick={async ()=>{
                                            if (selected_data.length === 0) {
                                                set_feedback_snackbar({state:true,type:"warning",text:"No episode selected."});
                                                return
                                            }
                                            set_is_managing(true);
                                            const watch_id = selected_data[0].id
                                            const get_watch_result = await get_watch({
                                                source_id,preview_id,season_id, watch_id,
                                                server_type:null, server_id: null,

                                            })
                                            
                                            if (get_watch_result.code === 200){
                                                if (Object.keys(get_watch_result?.result?.server_info?.server_list)?.length > 0){
                                                    SET_PREFER_SERVER_LIST(get_watch_result.result.server_info.server_list);
                                                    set_feedback_snackbar({state:true, type:"success" ,text:"Preferable information request successfully."});
                                                    set_precise_mode(true);
                                                }else{
                                                    set_feedback_snackbar({state:true,type:"error",text:"Unable to request precise information."});
                                                }
                                            }else{
                                                set_feedback_snackbar({state:true,type:"error",text:"Unable to request precise information."});
                                            }
                                            set_is_managing(false);
                                        }}
                                    >
                                        <InputRoundedIcon fontSize='medium' sx={{color:'var(--color)'}}/>
                                    </IconButton>
                                </Tooltip>

                                <Button
                                    type='submit'
                                    variant='contained'
                                    color='primary'
                                    
                                >
                                    Submit
                                </Button>
                            </>
                        }</>
                        
                    </div>
                </form>
            </motion.div>
        </div>
    </>)
}

export default ManageDownloadWidget;