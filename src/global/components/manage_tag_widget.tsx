// React Imports
import { useEffect, useState, useRef, useContext } from 'react';

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
import {global_context} from '../scripts/contexts';
// Styles
import styles from "../styles/manage_tag_widget.module.css";

const ManageTagWidget  = ({onClose=()=>{}, callback=({})=>{}}:any) => {
    const {set_feedback_snackbar} = useContext<any>(global_context)

    const [create_tag, set_create_tag] = useState<any>({tag_name:"",error:false,message:""});
    const [tag_data, set_tag_data] = useState<any>([]);
    const [search, set_search] = useState<string>("");
    const isRun = useRef<boolean>(false);
    useEffect(()=>{
        if (isRun.current) return;
        isRun.current = true;
        (async () => {
            const result = await request_tag_data();
            if (result.code === 200){
                set_tag_data(result.data);
            }
            isRun.current = false;
        })();
        return;
    },[])


    const RenderItem = ({tag_name}:any) => {
        const [edit_tag, set_edit_tag] = useState<boolean>(false);
        const [delete_tag, set_delete_tag] = useState<boolean>(false);
        const [new_tag_name, set_new_tag_name] = useState<string>("");
        const [edit_error,set_edit_error] = useState<any>({state:false,message:""});
        return (<>
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    height: "auto",
                    border: edit_tag ? "2px solid var(--background-color)" : "none",
                    borderRadius:"8px",
                    boxSizing:"border-box",
                    flexDirection:"column",
                }}
            >
                <div 
                    style={{
                        display:"flex",
                        flexDirection:"row",
                        justifyContent:"space-between",
                        alignItems:"center",
                        flex:1,
                        width:"100%",
                        height:"auto",
                        padding:"12px",
                        border:"2px solid var(--background-color)",
                        borderRadius:"inherit",
                        boxSizing:"border-box",
                        gap:"8px",
                        boxShadow: edit_tag ? "rgba(0, 0, 0, 0.35) 0px 5px 15px" : "none",
                    }}
                >
                    {/* Text Field/<p> Section */}
                    <>{edit_tag ? (
                        <Tooltip title={edit_error.message}>
                            <TextField
                                label="Tag name"
                                variant="standard"
                                size="small"
                                value={new_tag_name}
                                error={edit_error.state}
                                focused
                                slotProps={{ htmlInput: { maxLength: 64 } }}
                                sx={{
                                    width:"100%",
                                    input:{
                                        color:"var(--color)",
                                        fontFamily:"var(--font-family-medium)",
                                        fontSize:"18px",
                                    }
                                }}
                                onChange={(e)=>{
                                    if (!e.target.value.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/) && e.target.value) {
                                        set_edit_error({state:true, message:"Invalid tag name format."});
                                    }else {
                                        edit_error ? set_edit_error({state:false, message:""}) : null;
                                        set_new_tag_name(e.target.value)
                                    };
                                }}  
                            />    
                        </Tooltip>
                    ) : (
                        <span
                            style={{
                                height:"auto",
                                width:"100%",
                                color:"var(--color)",
                                fontFamily:"var(--font-family-medium)",
                                fontSize:"18px",
                                wordBreak:"break-all",
                            }}
                        >{tag_name}</span>
                    )}</>

                    {/* Icon section */}
                    <>{edit_tag ? (
                        <Tooltip title="Cancel edit tag">
                            <IconButton style={{color:"red"}}
                                onClick={()=>{
                                    set_new_tag_name(tag_name);
                                    set_edit_tag(false);
                                }}
                            >
                                <CloseRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    ):(
                        <Tooltip title="Edit tag">
                            <IconButton style={{color:"var(--icon-color-1)"}}
                                onClick={()=>{
                                    set_new_tag_name(tag_name);
                                    set_edit_tag(true);
                                }}
                            >
                                <EditRoundedIcon />
                            </IconButton>
                        </Tooltip>
                    )}</>
                </div>
                <>{edit_tag && !delete_tag && (
                    <div
                        style={{
                            display:"flex",
                            flexDirection:"column",
                            justifyContent:"space-around",
                            alignItems:"center",
                            width:"100%",
                            height:'auto',
                            padding:"25px"
                        }}
                    >
                        <div
                            style={{
                                display:"flex",
                                flexDirection:"row",
                                justifyContent:"space-around",
                                width:"100%",
                                height:'auto',
                            }}
                        >
                            <Button color='error' variant='contained'
                                onClick={()=>{
                                    set_delete_tag(true);
                                }}
                            >Delete</Button>
                            <Button color='success' variant='contained'
                                onClick={async ()=>{
                                    if (tag_name === new_tag_name) {
                                        set_edit_error({state:true, message:"New tag name can't be same."});
                                        return;
                                    }
                                    const result = await request_rename_tag({current_tag_name:tag_name,new_tag_name:new_tag_name});
                                    console.log("AAA", result);
                                    if (result.code === 200){
                                        const result = await request_tag_data();
                                        if (result.code === 200){
                                            set_tag_data(result.data);
                                            callback({tag_data:result.data});
                                        }else{
                                            set_edit_error({state:true, message:result.message});
                                        }
                                        set_edit_tag(false);
                                    }else{
                                        set_edit_error({state:true, message:result.message});
                                    }
                                }}
                            >Save</Button>
                        </div>
                    </div>
                )}</>

                <>{delete_tag && (
                    <div
                        style={{
                            display:"flex",
                            flexDirection:"column",
                            justifyContent:"space-around",
                            alignItems:"center",
                            width:"100%",
                            height:'auto',
                            padding:"25px"
                        }}
                    >
                        <p
                            style={{
                                color:"var(--color)",
                                fontFamily:"var(--font-family-medium)",
                                fontSize:"calc((100vw + 100vh)*0.025/2)",
                                textAlign:"center"
                            }}
                        >Are you sure you want to delete this tag? <br/>This will delete all content inside, make sure to migrate it to other tag.</p>
                        <div
                            style={{
                                display:"flex",
                                flexDirection:"row",
                                justifyContent:"space-around",
                                width:"100%",
                                height:'auto',
                            }}
                        >
                            <Button color='primary'  variant='contained'
                                onClick={()=>{
                                    set_delete_tag(false);
                                }}
                            >No</Button>
                            <Button color='error' variant='contained'
                                onClick={async ()=>{
                                    const result = await request_delete_tag({tag_name:tag_name});
                                    if (result.code === 200){
                                        const result = await request_tag_data();
                                        if (result.code === 200){
                                            set_tag_data(result.data);
                                            callback({tag_data:result.data});
                                        }else{
                                            set_edit_error({state:true, message:result.message});
                                        }
                                    }
                                    set_feedback_snackbar({state:true, type:"warning", text:`Tag [${tag_name}] deleted successfully.`});
                                }}
                            ><DeleteRoundedIcon /></Button>
                        </div>
                    </div>
                )}</>

                
                
            </div>
        </>)
    }
    
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
                        onClick={()=>{onClose()}}
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
                                <input type='text' placeholder='Search' value={search}
                                    onChange={(e)=>{set_search(e.target.value)}}
                                ></input>
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
                                    <motion.form className={styles.edit_content_body_create_tag_box} onSubmit={(e)=>e.preventDefault()}
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
                                            display:'flex',
                                            background:"var(--background-color)",
                                            width:"100%",
                                            height:"auto",
                                            borderTopLeftRadius:"inherit", borderTopRightRadius:"inherit",
                                            padding:"12px",
                                            alignItems:"center",
                                        }}>
                                            <Tooltip title={create_tag.message}>
                                                <TextField focused={true} variant='standard' label='Tag name' placeholder='eg. Movie, TV Show' slotProps={{ htmlInput: { maxLength: 64 } }}
                                                    value={create_tag.tag_name} error={create_tag.error} required
                                                    sx={{
                                                        width:"100%",
                                                        input: {
                                                            color:"var(--color)",
                                                            fontFamily:"var(--font-family-regular)",
                                                        }
                                                    }}
                                                    onChange={(e)=>{
                                                        if (!e.target.value.match(/^[a-zA-Z0-9_][a-zA-Z0-9_ ]*$/) && e.target.value) {
                                                            set_create_tag({...create_tag,error:true,message:"Invalid tag name format."})
                                                        }else set_create_tag({...create_tag,tag_name:e.target.value,error:false,message:""})
                                                    }}
                                                />
                                            </Tooltip>

                                            
                                        </div>
                                        <div style={{
                                            display:"flex",
                                            background:"var(--background-color)",
                                            padding:"25px",
                                            justifyContent:"space-around",
                                            width:"auto",
                                            borderBottomLeftRadius:"inherit", borderBottomRightRadius:"inherit",
                                        }}>
                                            <Button variant="outlined"
                                                onClick={()=>{set_create_tag({...create_tag,state:false})}}
                                            >Cancel</Button>
                                            <Button variant='contained' type='submit'
                                                onClick={async()=>{
                                                    if (!create_tag.tag_name) return
                                                    const result = await request_create_tag({tag_name:create_tag.tag_name});
                                                    if (result.code === 200) {
                                                        set_create_tag({...create_tag,state:false})
                                                        
                                                        const result = await request_tag_data();
                                                        if (result.code === 200){
                                                            set_tag_data(result.data);
                                                            callback({tag_data:result.data});
                                                        }
                                                        
                                                    }else{
                                                        set_create_tag({...create_tag, error:true, message:result.message})
                                                    }   
                                                    set_feedback_snackbar({state:true, type:"info", text:`Tag [${create_tag.tag_name}] created successfully.`});
                                                }}
                                            >Create</Button>
                                        </div>
                                            
                                    </motion.form>
                                )}
                            </AnimatePresence>
                            <div
                                style={{
                                    display:"flex",
                                    flexDirection:"column",
                                    width:"100%",
                                    height:"auto",
                                    gap:"8px",
                                }}
                            >
                                <>{tag_data.filter((tag_name:any) => tag_name.toLowerCase().includes(search.toLowerCase())).map((item:any,index:number)=>(
                                    <RenderItem key={index} tag_name={item}/>
                                ))}</>
                                
                                
                            </div>
                            
                            

                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </>)
}

export default ManageTagWidget;