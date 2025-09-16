import { onMount, onCleanup, createSignal, children as resolve_children } from "solid-js";
import type { JSX, JSXElement } from "solid-js";

// Style Imports
import styles from "../styles/grid_box.module.css"

export default function GridBox({
    children,
    row_gap=0,
    column_gap=0,
    style,
}:{
    children: JSXElement,
    row_gap?: number,
    column_gap?: number,
    style?: JSX.CSSProperties
}) {

    let CONTAINER_REF!: HTMLDivElement;
    let GRID_BOX_REF!: HTMLDivElement;

    const resolved_children = resolve_children(() => children);

    const [item_per_row, set_item_per_row] = createSignal(0);

    onMount(() => {
        const on_resize = () => {
            const container_wdith = CONTAINER_REF.clientWidth;
            const first_item = GRID_BOX_REF.children[0] as HTMLDivElement;
            if (!first_item) return;
            const first_item_width = first_item?.offsetWidth;
            
            let temp_item_per_row =  Math.floor(container_wdith / first_item_width);
            let total_row_gap = (temp_item_per_row - 1) * row_gap;


            let item_per_row = Math.floor((container_wdith-total_row_gap) / first_item_width);
            
            set_item_per_row(item_per_row);
        }


        on_resize();
        const resizeObserver = new ResizeObserver(on_resize);
        resizeObserver.observe(CONTAINER_REF);
        
        onCleanup(() => {
            resizeObserver.disconnect();
        })
    });


    return (<div ref={CONTAINER_REF} class={styles.container} style={style}>
        <div
            ref={GRID_BOX_REF}
            class={styles.grid_box}

            style={{
                "grid-template-columns": `repeat(${item_per_row()}, 1fr)`,
                "column-gap": `${row_gap}px`,
                "row-gap": `${column_gap}px`,
            }}
        >
            {resolved_children()}
        </div>
        
    </div>)
}