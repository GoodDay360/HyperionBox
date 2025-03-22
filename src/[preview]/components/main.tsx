import { useEffect } from "react";
import { useParams } from "react-router";

const Preview = () => {
    const { source_id, preview_id } = useParams();
    useEffect(()=>{
        console.log(source_id,preview_id)
    },[])
    return (
        <div>
            <h1>Preview</h1>
        </div>
    );
}

export default Preview;