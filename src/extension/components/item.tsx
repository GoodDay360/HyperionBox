// Tauri Plugin
import { path } from '@tauri-apps/api';
import {remove, BaseDirectory, exists} from '@tauri-apps/plugin-fs';

// React Import
import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { useNavigate } from "react-router";

// MUI Imports
import { ButtonBase, IconButton, Tooltip } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import UpgradeRoundedIcon from '@mui/icons-material/UpgradeRounded';

// styles Import
import styles from "../styles/main.module.css";

// Semver Import
import semver from "semver";


// Lazy Load Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Custom Import
import { global_context } from "../../global/scripts/contexts";
import write_crash_log from "../../global/scripts/write_crash_log";
import get_source from "../scripts/get_source";
import { remove_source } from "../../global/scripts/manage_extension";
import install_source from "../scripts/install_source";

const Item = ({id,data,installed,installed_version}:{id:string,data:any,installed:boolean,installed_version:string})=>{
    console.log(installed_version)
    const [is_installed, set_is_installed] = useState<boolean>(installed);
    const [is_updating, set_is_updating] = useState<boolean>(false);

    const [is_managing, set_is_managing] = useState<boolean>(false);
    const [update_available, set_update_available] = useState<boolean>(installed_version ? semver.lt(installed_version, data.version) : false);
    
    useEffect(()=>{
        ;(async()=>{
            const source_dir = await path.join(await path.appDataDir(), "extension", "sources", id);
            if (!await exists(source_dir, {baseDir:BaseDirectory.AppData})){
                set_is_installed(false);
            }
        })()
        
    },[]);

    return (
        <div className={styles.item_container}>
            <>{update_available &&
                <>{is_updating
                    ? <Tooltip title={"Updating..." }>
                        <CircularProgress size={"max(25pt, calc((100vw + 100vh)/2 * 0.0325))"} />
                    </Tooltip>
                    : <Tooltip 
                        title={<span style={{color:"aqua"}}>
                            Update Available
                        </span>}
                    >
                    <IconButton
                        sx={{
                            color: "aqua",
                        }}
                        onClick={async()=>{
                            if (is_updating) return;
                            set_is_updating(true);
                            const install_source_result = await install_source({
                                id,
                                url:data.url,
                                domain:data.domain,
                                icon:data.icon,
                                title:data.title,
                                description:data.description,
                                version:data.version
                            });
                            if (install_source_result.code === 200){
                                set_is_installed(true);
                                set_update_available(false);
                            }
                            set_is_updating(false);
                        }}
                    >
                        <UpgradeRoundedIcon sx={{fontSize:"max(25pt, calc((100vw + 100vh)/2 * 0.0325))"}}/>
                    </IconButton>
                </Tooltip>

                }</>
                
            }</>
            <Tooltip placement="bottom"
                title={<span>
                    
                    {data.description}
                    <br />
                    - Current Version: {data.version}
                    <br />
                    - Installed Version: {installed_version}
                    
                
                </span>} 
            
            >
                <div className={styles.item_box}>
                    <div className={styles.item_icon_box}>
                        <LazyLoadImage
                            style={{width:"100%",height:"auto"}}
                            src={data.icon}
                        />
                    </div>
                    <span className={styles.item_title}>{data.title}</span>
                </div>
                
            </Tooltip>
            <>{is_managing
                ? <Tooltip title={is_installed ? <span style={{color:"red"}}>Uninstalling...</span> : "Installing..."}>
                    <CircularProgress size={"max(25pt, calc((100vw + 100vh)/2 * 0.0325))"} />
                </Tooltip>
                : <Tooltip title={is_installed ? <span style={{color:"red"}}>Uninstall</span> : "Install"}>
                    <IconButton
                        sx={{
                            color: is_installed ? "red" : "var(--color)",
                        }}
                        onClick={async()=>{
                            if (is_managing) return;
                            if (import.meta.env.DEV && import.meta.env.VITE_DEV_USE_CUSTOM_EXTENSIONS_DIRECTORY === "1") {
                                const message = "Unable to install. To prevent source code modification, this action is canceled because you're using custom extension directory."
                                console.log(message);
                                return;
                            }
                            if (is_installed){
                                set_is_managing(true);
                                const source_dir = await path.join(await path.appDataDir(), "extension", "sources", id);
                                await remove(source_dir, {baseDir:BaseDirectory.AppData, recursive:true}).catch(e=>{console.error(e)});
                                await remove_source({id});
                                set_is_installed(false);
                                set_is_managing(false);
                            }else{
                                set_is_managing(true);
                                const install_source_result = await install_source({
                                    id,
                                    url:data.url,
                                    domain:data.domain,
                                    icon:data.icon,
                                    title:data.title,
                                    description:data.description,
                                    version:data.version
                                });
                                if (install_source_result.code === 200){
                                    set_is_installed(true);
                                }
                                set_is_managing(false);
                            }
                            
                        }}
                    >
                        <>{is_installed
                            ? <CloseRoundedIcon sx={{fontSize:"max(25pt, calc((100vw + 100vh)/2 * 0.0325))"}}/>
                            : <DownloadRoundedIcon sx={{fontSize:"max(25pt, calc((100vw + 100vh)/2 * 0.0325))"}}/>
                        }</>
                        
                    </IconButton>
                </Tooltip>
            }</>
    </div>
)}

export default Item;