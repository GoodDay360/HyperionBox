export default function horizontal_scroll(
    e: WheelEvent & { currentTarget: HTMLDivElement; target: Element }
) {
    e.preventDefault();
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return;

    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);

    // Heuristic: mouse wheels usually have large deltaY steps (±100+),
    // touchpads produce small continuous deltas (<50).
    const isMouseWheel = absY > 50 && absX < 1;

    if (absX > absY) {
        // Horizontal gesture (touchpad swipe left/right)
        el.scrollBy({
            left: e.deltaX,
            behavior: "auto",
        });
    } else {
        if (isMouseWheel) {
            // Mouse wheel vertical scroll → map to horizontal, smooth
            el.scrollBy({
                left: e.deltaY,
                behavior: "smooth",
            });
        } else {
            // Touchpad vertical drag → map to horizontal, auto for fluidity
            el.scrollBy({
                left: e.deltaY,
                behavior: "auto",
            });
        }
    }
}
