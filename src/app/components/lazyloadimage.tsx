// SolidJS Imports
import { onMount, onCleanup, createSignal } from "solid-js";
import type { JSX } from "solid-js";

// SUID Imports
import { Skeleton } from "@suid/material";
import type { SxProps } from "@suid/system";

// Media Imports
import NO_IMG from "@src/assets/media/no-image-2.jpg";

export default function LazyLoadImage({
    src,
    className,
    style,
    skeleton_sx,
    in_view_only=true
}:{
    src: string,
    className?: string,
    style?: JSX.CSSProperties,
    skeleton_sx?: SxProps,
    in_view_only?: boolean
}) {

    let REF!: HTMLDivElement;
    const [is_loaded, set_is_loaded] = createSignal(false);
    const [is_in_view, set_is_in_view] = createSignal(false);
    
    onMount(()=>{
        if (in_view_only) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        set_is_in_view(true);
                        observer.disconnect();
                    }
                });
            }, {
                root: null, // viewport
                rootMargin: '0px',
                threshold: 0.1 // trigger when 10% of the element is visible
            });

            observer.observe(REF);

            onCleanup(() => {
                observer.disconnect();
            });
        }else{
            set_is_in_view(true);
        }
    })

    return (<div ref={REF}
        class={className}
        style={style}
    >
        {!is_loaded() && 
            <Skeleton variant="rectangular" sx={skeleton_sx} />
        }
        {is_in_view() && 
            <img src={(src.trim().length > 0) ? src : NO_IMG} class={className} style={{...style, display: is_loaded() ? "block" : "none"}} 
                on:load={() => set_is_loaded(true)}
                ref={el => {
                    // If the image is already cached and complete, fire manually
                    if (el && el.complete) {
                        set_is_loaded(true);
                    }
                }}
            />
        }
        
    </div>)

}