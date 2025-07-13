// Tauri Plugins
import { path } from '@tauri-apps/api';
import { readTextFile, exists, BaseDirectory, remove, writeTextFile } from '@tauri-apps/plugin-fs';

// React Imports
import { useEffect, useState, useCallback, useContext } from 'react';

// MUI Imports
import { IconButton, Button, Tooltip } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ImportExportRoundedIcon from '@mui/icons-material/ImportExportRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';

// Custom MUI
import { CustomAutocomplete } from './custom_mui';

// Framer motion
import { motion } from 'framer-motion';

// Custom Imports
import { translate_from, translate_to } from '../scripts/translate_array';
import translate_caption from '../scripts/translate_caption';
import { global_context } from '../../global/scripts/contexts';

// Styles
import styles from "../styles/manage_translate_widget.module.css";

const ManageTranslateWidget  = ({
    source_id,preview_id,season_id,watch_id,
    MEDIA_TRACK=[],onClose=()=>{}, onSubmit=({})=>{}
}:any) => {

    const {set_feedback_snackbar} = useContext<any>(global_context)

    const [INSTALLED_CAPTIONS, _] = useState<any>(MEDIA_TRACK.filter((track:any)=>{return (track?.label && ((track?.kind === "captions") || (track?.type === "captions")))}));
    const [TRACK, SET_TRACK] = useState<any>([]);
    const [selected_installed_source, set_selected_installed_source] = useState<any>(null);
    const [selected_translate_from, set_selected_translate_from] = useState<any>(translate_from[0]);
    const [selected_translate_to, set_selected_translate_to] = useState<any>(translate_to[0]);

    const [is_translating, set_is_translating] = useState<boolean>(false);

    const get_track = useCallback(async ()=>{
        const track_manifest_path = await path.join(await path.appDataDir(), "data", source_id, preview_id, season_id, "download", watch_id, "translated_track", "manifest.json");
        if (await exists(track_manifest_path)) {
            try {
                const manifest_data = JSON.parse(await readTextFile(track_manifest_path, {baseDir:BaseDirectory.AppData}));
                SET_TRACK(manifest_data);
                onSubmit();
            } catch (e) {
                console.error(e);
            }
        }
    },[]);

    useEffect(()=>{
        console.log(INSTALLED_CAPTIONS)
        ;(async ()=>{
            await get_track();
        })();
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
                    <h3 className={styles.title}>Captions Translation</h3>
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
                    <form className={styles.body_box_1}
                        onSubmit={async (e:any)=>{
                            e.preventDefault();
                            set_is_translating(true);
                            const translate_result = await translate_caption({
                                source_id,preview_id,season_id,watch_id,
                                selected_translate_from,selected_translate_to,selected_installed_source
                            });

                            if (translate_result?.code !== 200){
                                set_feedback_snackbar({state:true, text:translate_result.message, type:"error"});
                            }else{
                                set_feedback_snackbar({state:true, text:"Translation complete successfully!", type:"success"});
                            }
                            await get_track();
                            await onSubmit();
                            set_is_translating(false);
                        }}
                    >
                        <div
                            style={{
                                width:"40%",
                                display: "flex",
                                flexDirection:"column",
                                gap:"12px",
                                boxSizing:"border-box"
                            }}
                        >

                            
                            <div style={{flex: 1,width:"100%"}}>
                                <Tooltip title="Source language of selected caption.">
                                    <CustomAutocomplete required={true}
                                        defaultValue={translate_from[0]}
                                        value={selected_translate_from}
                                        label="From Language"
                                        options={translate_from}
                                        onChange={(_:any, selected:any) => {set_selected_translate_from(selected);console.log(selected)}}
                                    />
                                </Tooltip>
                            </div>
                            <div style={{flex:1, display:"flex", justifyContent:"center",alignItems:"center"}}>
                                <ImportExportRoundedIcon sx={{color:"var(--color)"}} fontSize='medium'/>
                            </div>
                            <div style={{flex: 1,width:"100%",}}>
                                <Tooltip title="Target language to translate caption.">
                                    <CustomAutocomplete required={true}
                                        defaultValue={translate_to[0]}
                                        value={selected_translate_to}
                                        label="To Language"
                                        options={translate_to}
                                        onChange={(_:any, selected:any) => {set_selected_translate_to(selected);console.log(selected)}}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                        <div
                            style={{
                                flex:1,
                                display: "flex",
                                flexDirection:"column",
                                boxSizing:"border-box",
                                justifyContent:"space-between",
                                alignItems:"center"
                            }}
                        >
                            <Tooltip title="Recommended to select English caption for better translation.">
                                <CustomAutocomplete required={true}
                                    value={selected_installed_source}
                                    label="Select Available Captions to Translate"
                                    options={INSTALLED_CAPTIONS}
                                    onChange={(_:any, selected:any) => {set_selected_installed_source(selected);console.log(selected.value)}}
                                />
                            </Tooltip>
                            <div
                                style={{
                                    width:"100%",
                                    height:"auto",
                                    display:"flex",
                                    flexDirection:"row",
                                    justifyContent:"center",
                                    alignItems:"center",
                                    boxSizing:"border-box"
                                }}
                            >
                                <Button variant={is_translating ? "text" : "contained"} color="secondary" type='submit' disabled={is_translating}
                                    sx={{
                                        width:"50%",
                                    }}
                                >
                                    <>{is_translating
                                        ? <CircularProgress color="secondary" size="calc((100vw + 100vh)*0.035/2)"/>
                                        : "Begin Translation"
                                    }</>
                                </Button>
                            
                            </div>
                        </div>
                    </form>
                    <fieldset className={styles.fieldset_box}>
                        <legend className={`float-none w-auto ${styles.legend_box}`}>Translated Captions</legend>
                        
                        <>{TRACK.map((item:any,index:number)=>(
                            <div key={index} style={{
                                display:"flex",
                                alignItems:"center",
                                justifyContent:"space-between",
                            }}>
                                <span className={styles.fieldset_text}>{item.label}</span>
                                <IconButton
                                    onClick={async ()=>{
                                        const track_dir = await path.join(await path.appDataDir(), "data", source_id, preview_id, season_id, "download", watch_id, "translated_track")
                                        if (await exists(item.url)) await remove(item.url, {baseDir:BaseDirectory.AppData, recursive:true});
                                        const track_manifest_path = await path.join(track_dir, "manifest.json");
                                        try {
                                            const manifest_data = JSON.parse(await readTextFile(track_manifest_path, {baseDir:BaseDirectory.AppData}));
                                            manifest_data.splice(index,1);
                                            await writeTextFile(track_manifest_path, JSON.stringify(manifest_data), {baseDir:BaseDirectory.AppData, create:true});
                                            await get_track();
                                        } catch (e) {
                                            await writeTextFile(track_manifest_path, "{}", {baseDir:BaseDirectory.AppData, create:true});
                                            console.error(e);
                                        }
                                        onSubmit();
                                        set_feedback_snackbar({state:true, text:"Removed caption successfully!", type:"warning"});
                                    }}
                                
                                ><DeleteForeverRoundedIcon color="error"/></IconButton>
                            </div>
                            
                        ))}</>
                        
                    </fieldset>
                </div>
            </motion.div>
        </div>
    </>)
}

export default ManageTranslateWidget;