// React Import
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";

// MUI Imports
import { ButtonBase, IconButton } from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

// styles Import
import styles from "../styles/main.module.css";


// Lazy Load Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Custom Import
import get_list from "../scripts/get_list";
import { get_installed_sources } from "../../global/scripts/manage_extension_sources";
import write_crash_log from "../../global/scripts/write_crash_log";


const Explore = () => {
    const navigate = useNavigate();
    const [search, set_search] = useState<string>("");
    const [DATA, SET_DATA] = useState<any>({});
    const [search_count, set_search_count] = useState<number>(0);
    const [is_searching, set_is_searching] = useState<boolean>(false);
    const [is_searching_hover, set_is_searching_hover] = useState<boolean>(false);
    const [error,set_error] = useState<boolean>(false);
    
    const cancel_search = useRef<boolean>(false);
    
    useEffect(()=>{
        set_search_count(0);
        cancel_search.current = false;
        return () =>{
            cancel_search.current = true;
        }
    },[])

    const is_run = useRef<boolean>(false);
    const is_run_timeout = useRef<any>(null);
    const get_data = useCallback(()=>{
        clearTimeout(is_run_timeout.current);
        const task = async () => {
            if (is_run.current) {
                setTimeout(async() => await task(), 1000);
                return;
            };
            is_run.current = true;
            try{
                set_error(false)
                set_is_searching(true)
                SET_DATA({});
                set_search_count(0);
                const source_list = await get_installed_sources();
                if (source_list.code === 200){
                    const data:any = {};
                    for (const source of source_list.data){
                        set_search_count(x => x+=1);
                        if (cancel_search.current) {
                            cancel_search.current = false;
                            break;
                        }
                        const request = await get_list({source_id:source.id, search:search});
                        if (request.code === 200){
                            if (!request.result.data?.length) continue;
                            data[source.id] = {
                                title: source.title,
                                data: request.result.data,
                                max_page: request.result.max_page,
                                status: request.result.status,
                            };
                        }
                    }
                    SET_DATA(data);
                    console.log(data);
                }
            }catch(e){
                SET_DATA({});
                set_error(true)
                console.error(e);
                await write_crash_log(`[Mode:String](Error at 'get_data'): ${String(e)}`);
                await write_crash_log(`[Mode:JSON](Error at 'get_data'): ${JSON.stringify(e)}`);
            }
            cancel_search.current = false;
            set_is_searching(false);
            is_run.current = false;
        };
        (async () => {
            await task();
        })();
        return;
    },[search])

    const RenderItem = useCallback(({source_id, _item}:{source_id:string,_item?:any}) => {
        return (<>
            <ButtonBase
                sx={{
                    display:"flex",
                    padding:0,
                    margin:0,
                    width:"calc((100vw + 100vh)*0.15/2)",
                    height:"auto",
                    borderRadius:"8px",
                    gap:"8px",
                    flexShrink:0,
                    flexDirection:"column",
                    flexGrow:0,
                }}
                onClick={()=>{
                    console.log(_item);
                    navigate(`/preview/${source_id}/${_item.id}`);
                }}
            >
                <div
                    style={{
                        height:"calc((100vw + 100vh)*0.225/2)",
                        background:"var(--background-color-layer-1)",
                        borderRadius:"8px",
                    }}
                >
                    <LazyLoadImage
                        style={{
                            width:"100%",
                            height:"100%",
                            objectFit:"cover",
                            borderRadius:"inherit",
                        }}
                        alt={_item.title}
                        src={_item.cover}
                    />
                </div>
                <span
                    style={{
                        color:"var(--color)",
                        fontFamily:"var(--font-family-medium)",
                        fontSize:"calc((100vw + 100vh)*0.015/2)",
                        wordBreak:"break-word",
                        width:"100%",
                        height:"auto",
                        textAlign:"center"
                    }}
                >{_item.title}</span>
            </ButtonBase>
            
        </>)
    },[])

    const RenderSource = useCallback(({source_id,item}:{source_id:string,item:any}) => {
        return (<>
            <div style={{
                display:'flex',
                flexDirection:'column',
                width:"100%",
                gap:12,
                boxSizing:'border-box',
                flexShrink:0,
                flexGrow:0,
            }}>
                <div
                    style={{
                        borderBottom:"2px solid var(--color)",
                        width:"100%",
                        display:"flex",
                        flexDirection:"row",
                        alignItems:"center",
                        justifyContent:"space-between",
                        boxSizing:"border-box",
                    }}
                >
                    <h3
                        style={{
                            color:"var(--color)",
                            fontFamily:"var(--font-family-medium)",
                            fontSize:"calc((100vw + 100vh)*0.035/2)",
                            wordBreak:"break-word",
                            width:"auto",
                            padding:"12px",
                            justifySelf:"flex-start",
                        }}
                    >{item.title}</h3>
                    <>{item.max_page > 1 && (<>
                        <h3
                            style={{
                                color:"var(--color-2)",
                                fontFamily:"var(--font-family-medium)",
                                fontSize:"calc((100vw + 100vh)*0.025/2)",
                                wordBreak:"break-word",
                                width:"auto",
                                padding:"12px",
                                justifySelf:"flex-end",
                            }}
                        >+{item.max_page-1} pages</h3>
                    </>)}</>
                    
                </div>
                <div
                    style={{
                        display:"flex",
                        width:"100%",
                        height:"auto",
                        flexWrap:"nowrap",
                        boxSizing:"border-box",
                        flexDirection:"row",
                        gap:18,
                        overflow:"auto",
                        background:"var(--background-color)",
                        padding:"12px",
                        alignItems:"flex-start",
                    }}
                >
                    <>{item.data.map((_item:any,index:number)=>(
                        <RenderItem key={index} source_id={source_id} _item={_item}/>
                    ))}</>
                </div>
                
            </div>
        </>)
    },[])

    return (<>
        <div className={styles.container}>
            <div className={styles.header}>
                <form className={styles.search_container} onSubmit={(e)=>e.preventDefault()}>
                    <div className={styles.search_box}>
                        <input type='text' placeholder='Search' value={search} required
                            onChange={(e)=>set_search(e.target.value)}
                        />
                    </div>
                    <>{is_searching 
                        ? <>
                            <IconButton color="primary" size='large' type="button" onMouseEnter={()=>set_is_searching_hover(true)} onMouseLeave={()=>set_is_searching_hover(false)}
                                onClick={async ()=>{
                                    cancel_search.current = true;
                                }}
                            >
                                {is_searching_hover 
                                    ? <CloseRoundedIcon sx={{color:"red"}} />
                                    : <CircularProgress color="primary" size="20px"/>
                                }
                            </IconButton>
                        </>
                        : <>
                            <IconButton color="primary" size='large' type="submit" 
                                onClick={async ()=>{
                                    if (!search) return;
                                    await get_data()
                                }}
                            >
                                <SearchRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                            </IconButton>
                        </>
                    }</>
                    
                </form>
            </div>
            <div className={styles.body}>
                <>{Object.keys(DATA).length
                    ? <>
                        <>{Object.keys(DATA).map((item,index)=>(
                            <RenderSource key={index} source_id={item} item={DATA[item]} />
                        ))}</>
                    </>
                    : <>
                        <div
                            style={{
                                width:"100%",
                                height:"100%",
                                justifyContent:"center",
                                alignItems:"center",
                                display:"flex",
                                boxSizing:"border-box",
                            }}
                        >
                            <h3
                                style={{
                                    width:"auto",
                                    height:"auto",
                                    textAlign:"center",
                                    color:"var(--color)",
                                    fontFamily:"var(--font-family-medium)",
                                }}
                            >
                                
                                
                                <>{error 
                                    ? <>Something went wrong, feedback sent to crash.log.<br/>You can try again.</>
                                    : <>{is_searching
                                        ? "Searching..." 
                                        : <>{search_count > 0
                                            ? "No result, try search something else." 
                                            : "Try search something."
                                        }</>
                                    }</>
                                }</>
                                
                                
                            </h3>
                        </div>
                    </>
                }</>
            </div>
        </div>
    </>)
}

export default Explore;