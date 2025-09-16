// SolidJS Imports
import { onMount, onCleanup, createSignal } from "solid-js";
import type { JSX } from "solid-js";

// SUID Imports
import { Skeleton } from "@suid/material";
import type { SxProps } from "@suid/system";

export default function LazyLoadImage({
    src,
    className,
    style,
    skeleton_sx
}:{
    src: string,
    className?: string,
    style?: JSX.CSSProperties,
    skeleton_sx?: SxProps
}) {

    let REF!: HTMLImageElement;

    const [is_in_view, set_is_in_view] = createSignal(false);

    onMount(()=>{
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
    })

    return (<div ref={REF}
        class={className}
        style={style}
    >
        {is_in_view() 
            ? <img src={src} class={className} style={style} />
            : <Skeleton variant="rectangular" sx={skeleton_sx} />
        }
    </div>)

}