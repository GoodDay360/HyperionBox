// SolidJS Imports
import { onMount, onCleanup, createSignal } from "solid-js";
import type { JSX } from "solid-js";

// SUID Imports
import { Skeleton } from "@suid/material";
import type { SxProps } from "@suid/system";

// SUID Icon Imports
import RefreshRoundedIcon from '@suid/icons-material/RefreshRounded';

// Style Imports
import styles from "../styles/pull_refresh.module.css"

export default function PullRefresh({
    container,
    onRefresh=()=>{}
}:{
    container: HTMLElement,
    onRefresh:()=>void
}) {

    const [pulling, setPulling] = createSignal(false);
    const [request_refreshing, set_request_refreshing] = createSignal(false);
    const threshold = 60;
    let startY = 0;
    let PR_CONTAINER_REF!: HTMLDivElement;

    const handleTouchStart = (e: TouchEvent) => {
        if (container.scrollTop === 0) {
            startY = e.touches[0].clientY;
            setPulling(true);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!pulling() || request_refreshing()) return;

        const distance = e.touches[0].clientY - startY;
        if (distance > 0) {
            e.preventDefault();
            if (PR_CONTAINER_REF) PR_CONTAINER_REF.style.top = `${Math.min(distance - threshold, 40)}px`;
        }
    };

    const handleTouchEnd = () => {
        if (!pulling() || request_refreshing()) return;

        const currentTop = parseInt(PR_CONTAINER_REF?.style.top || "0");
        if (currentTop >= 0) {
            
            /* Refresh Method Here */
            onRefresh();

            /* === */

        } else {
            /* Cancel Refresh Method Here */

            /* === */
        }
        if (PR_CONTAINER_REF) PR_CONTAINER_REF.style.top = "-60px";

        set_request_refreshing(false);
        setPulling(false);
    };

    onMount(() => {
        container.addEventListener("touchstart", handleTouchStart);
        container.addEventListener("touchmove", handleTouchMove);
        container.addEventListener("touchend", handleTouchEnd);

        onCleanup(() => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        });
    });

    return (<div class={styles.container} ref={PR_CONTAINER_REF}>
        <RefreshRoundedIcon 
            sx={{
                color: "var(--color-1)",
                background: "var(--background-3)",
                border: "2px solid var(--background-2)",
                fontSize: "50px",
                borderRadius: "50%",
                padding: "8px"
            }}
            fontSize={"inherit"}
        />
        
    </div>)

}