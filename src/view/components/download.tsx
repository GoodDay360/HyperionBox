// Tauri API


// SolidJS Imports
import { createSignal, onMount, For } from "solid-js";

// SolidJS Router Imports


// SUID Imports
import { 
    Button,
    CircularProgress, MenuItem


} from '@suid/material';

// SUID Icon Imports
import DownloadRoundedIcon from '@suid/icons-material/DownloadRounded';

// Solid Toast
import toast from 'solid-toast';

// Components Import
import Select from '../../app/components/Select';

// Styles Import
import styles from "../styles/download.module.css"

// Script Import
import { get_episode_server } from '@src/watch/scripts/watch';
import { add_download } from '../scripts/download';

// Types Import
import { DownloadEpisode } from '../types/view_type';
import { EpisodeServerData } from '@src/watch/types/episode_server_type';

export default function Download({
    source,
    id,
    plugin_id,
    data={},
    onClose = () => {},
    onSuccess = () => {},
}:{
    source: string,
    id: string,
    plugin_id: string,
    onClose?: () => void,
    onSuccess?: () => void,
    data: DownloadEpisode,

}) {

    const [SERVER_DATA, SET_SERVER_DATA] = createSignal<EpisodeServerData>({});
    
    const [is_working, set_is_working] = createSignal(false);
    const [is_loading, set_is_loading] = createSignal(true);


    const [prefer_server_type, set_prefer_server_type] = createSignal<string>("");
    const [prefer_server_index, set_prefer_server_index] = createSignal<number>(-1);
    const [prefer_quality, set_prefer_quality] = createSignal(QUALITY.length-1);

    onMount(()=>{
        set_is_loading(true);
        const sample_episode_id = Object.keys(data)[0];
        const season_index = data[sample_episode_id].season_index;
        const episode_index = data[sample_episode_id].episode_index;
        get_episode_server(source, id, plugin_id, season_index, episode_index, sample_episode_id)
            .then((result)=>{
                console.log(result);
                SET_SERVER_DATA(result);
                if (Object.keys(result).length > 0) {
                    set_prefer_server_type(Object.keys(result)[0]);
                }
                set_is_loading(false);
            })
            .catch((e)=>{
                console.error("[get_episode_server]: ",e);
                toast.remove();
                toast.error("Something went wrong while getting server.",{
                    style: {
                        color:"red",
                    }
                })
            });
    })


    return (<div class={styles.container}>
        <div class={`${styles.box} animate__animated animate__zoomIn`}
            style={{
                "--animate-duration": "250ms",
            }}
        >
            <DownloadRoundedIcon 
                sx={{
                    color: "var(--color-1)",
                    fontSize: "calc((100vw + 100vh)/2*0.06)",
                }}
            />
            <span class={styles.title}>Download</span>
            {!is_loading()
                ? <div class={styles.options_box}>
                    <Select required disabled={is_working()}
                        value={prefer_server_type()}
                        label="Prefer Server Type"
                        onChange={(e)=>{
                            const value = e.target.value;
                            console.log(value)
                            set_prefer_server_type(value);
                        }}  
                        select_sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "var(--background-1)", 
                            },
                        }}
                    >
                        <For each={Object.keys(SERVER_DATA())}>
                            {(server_type)=>(
                                <MenuItem value={server_type}
                                    sx={{
                                        fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                    }}
                                >{server_type}</MenuItem>
                            )}
                        </For>
                        
                    </Select>

                    <Select required disabled={is_working()}
                        value={prefer_server_index()}
                        label="Prefer Server"
                        onChange={(e)=>{
                            const value = e.target.value;
                            console.log(value)
                            set_prefer_server_index(value);
                        }}  
                        select_sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "var(--background-1)", 
                            },
                        }}
                    >
                        <For each={SERVER_DATA()[prefer_server_type()??""]}>
                            {(server)=>(
                                <MenuItem value={server.index}
                                    sx={{
                                        fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                    }}
                                >{server.title}</MenuItem>
                            )}
                        </For>
                    </Select>

                    <Select required disabled={is_working()}
                        value={prefer_quality()}
                        label="Prefer Quality"
                        onChange={(e)=>{
                            const value = e.target.value;
                            set_prefer_quality(value);
                        }}  
                        select_sx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "var(--background-1)", 
                            },
                        }}
                    >
                        <For each={QUALITY}>
                            {(item, index) => (
                                <MenuItem value={index()}
                                    sx={{
                                        fontSize: 'calc((100vw + 100vh)/2*0.0175)',
                                    }}
                                >{item}</MenuItem>
                            )}
                        </For>
                    </Select>
                </div>
                : <CircularProgress color='secondary'
                    size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                />
            }
            <div class={styles.button_box}>
                {!is_working()
                    ? <>
                        <Button variant='text' color="error"
                            sx={{
                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                textTransform: "none",
                                maxWidth: "fit-content",
                                minWidth: "fit-content"
                            }}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button variant='text' color="primary" disabled={is_loading()}
                            sx={{
                                fontSize: "calc((100vw + 100vh)/2*0.0225)",
                                textTransform: "none",
                                maxWidth: "fit-content",
                                minWidth: "fit-content"
                            }}
                            onClick={()=>{(async ()=>{
                                if (!prefer_server_type() || (prefer_server_index() < 0) || (prefer_quality() < 0)) {
                                    toast.remove();
                                    toast.error("Missing required options.",{style: {color:"red"}});
                                    return;
                                }
                                set_is_working(true);

                                for (const episode_id of Object.keys(data)) {
                                    try {
                                        await add_download(
                                            source, id, plugin_id, 
                                            data[episode_id].season_index, data[episode_id].episode_index, episode_id, 
                                            prefer_server_type(), prefer_server_index() as number, prefer_quality()
                                        );
                                    }catch (e) {
                                        console.error("[Add Download]: ",e);
                                        toast.remove();
                                        toast.error("Something went wrong while adding download.",{style: {color:"red"}});
                                        return;
                                    }
                                }
                                set_is_working(false);
                                toast.remove();
                                toast.success("Download added successfully.",{style: {color:"green"}});
                                onSuccess();
                            })()}}
                        >
                            Submit
                        </Button>
                    </>

                    : <CircularProgress color='secondary'
                        size={"max(25px, calc((100vw + 100vh)/2*0.035))"}        
                    />
                }   
            </div>
        </div>
    </div>)
}

const QUALITY = ["Low", "Medium Low", "Medium High", "High"];