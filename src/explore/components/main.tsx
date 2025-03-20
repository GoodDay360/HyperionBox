// React Import
import { useEffect, useState, useRef, useCallback } from "react";


// MUI Imports
import { ButtonBase, IconButton } from "@mui/material";

// MUI Icons Import
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

// styles Import
import styles from "../styles/main.module.css";


// Lazy Load Imports
import { LazyLoadImage } from 'react-lazy-load-image-component';

// Custom Import
import get_list from "../scripts/get_list";
import { get_installed_sources } from "../../global/script/manage_extension_sources";


const Explore = () => {
    const [search, set_search] = useState<string>("");
    const [DATA, SET_DATA] = useState<any>({});
    const isRun = useRef<boolean>(false);
    useEffect(()=>{
        if (isRun.current) return;
        isRun.current = true;
        (async ()=>{
            isRun.current = false;
        })();
        return;
    },[])

    const get_data = useCallback(()=>{
        (async ()=>{
            const source_list = await get_installed_sources();
            if (source_list.code === 200){
                const data:any = {};
                for (const source of source_list.data){
                    const result = await get_list({source_id:source.id, search:search});
                    if (result.code === 200){
                        data[source.id] = {
                            title: source.title,
                            data: result.response.data,
                            max_page: result.response.max_page,
                            status: result.response.status,
                        };
                    }
                }
                SET_DATA(data);
                console.log(data);
            }
        })();
        return;
    },[search])

    const RenderItem = useCallback(({_item}:{_item?:any}) => {
        return (<>
            <ButtonBase
                sx={{
                    display:"flex",
                    padding:0,
                    margin:0,
                    width:"calc((100vw + 100vh)*0.15/2)",
                    height:"auto",
                    borderRadius:"8px",
                    gap:2,
                    flexShrink:0,
                    flexDirection:"column",
                    flexGrow:0,
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
                        >+{item.max_page}</h3>
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
                        <RenderItem key={index} _item={_item}/>
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
                    <IconButton color="primary" size='large' type="submit"
                        onClick={async ()=>{
                            if (!search) return;
                            await get_data()
                        }}
                    >
                        <SearchRoundedIcon sx={{color:"var(--icon-color-1)"}} />
                    </IconButton>
                    
                </form>
            </div>
            <div className={styles.body}>
                <>{Object.keys(DATA).map((item,index)=>(
                    <RenderSource key={index} source_id={item} item={DATA[item]} />
                ))}</>
            </div>
        </div>
    </>)
}

export default Explore;