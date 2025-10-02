// SolidJS Imports
import { onMount, For } from "solid-js";
import { children } from "solid-js";
import type { JSX } from "solid-js";

// SolidJS Router Imports


// SUID Imports

// Swiper Imports
import SwiperCore from 'swiper';
import type { SwiperOptions, AutoplayOptions } from "swiper/types";
import 'swiper/css'

import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


// Component Imports


// Style Imports
import "../styles/swiper.css"


export default function Swiper(props: { 
    class: string,
    children: JSX.Element,
    style?: JSX.CSSProperties,
    SwiperOptions?: SwiperOptions,
    AutoPlayOptions?: AutoplayOptions,
    usePagination?: boolean
    useNavigation?: boolean
    mousewheel?: boolean
    slidesPerView?: "auto" | number
    freeMode?: boolean
    grabCursor?: boolean
    simulateTouch?: boolean
}) {
    let swiper!: HTMLElement
    let swiper_pagination!: HTMLElement
    let swiper_button_next!: HTMLElement
    let swiper_button_prev!: HTMLElement

    const resolved = children(() => props.children);
    const swiper_children = resolved.toArray(); 

    onMount(() => {
        let SwiperConfig: SwiperOptions = {
            mousewheel: props.SwiperOptions?.mousewheel ?? true,
            slidesPerView: props.SwiperOptions?.slidesPerView ?? "auto",
            freeMode: props.SwiperOptions?.freeMode ?? true,
            grabCursor: props.SwiperOptions?.grabCursor ?? true,
            simulateTouch: props.SwiperOptions?.simulateTouch ?? true,
            modules: [Navigation, Pagination, Autoplay],
            direction: 'horizontal',
            loop: props.SwiperOptions?.loop ?? true,
            autoplay: {
                delay: props.AutoPlayOptions?.delay ?? 3000,
                disableOnInteraction: props.AutoPlayOptions?.disableOnInteraction ?? false,
                pauseOnMouseEnter: props.AutoPlayOptions?.pauseOnMouseEnter ?? true,
            },
        }
        if (props.usePagination) {
            SwiperConfig.pagination = {
                el: swiper_pagination,
            };
        }

        if (props.useNavigation) {
            SwiperConfig.navigation = {
                nextEl: swiper_button_next,
                prevEl: swiper_button_prev,
            };
        }

        new SwiperCore(swiper, SwiperConfig);
    })
    
    return (<div 
        ref={swiper as HTMLDivElement}
        class={`swiper ${props.class}`} 
        style={props.style}
    >
        
        <div class={`swiper-wrapper ${props.class}`} style={props.style}>
            <For each={swiper_children}>{(item) => (
                <div class={`swiper-slide`}>{item}</div>
            )}</For>
        </div>

        {props.useNavigation && <>
            <div class="swiper-button-prev" ref={swiper_button_prev as HTMLDivElement}/>
            <div class="swiper-button-next" ref={swiper_button_next as HTMLDivElement}/>
        </>}
        

        {props.usePagination && 
            <div class={`swiper-pagination`} ref={swiper_pagination as HTMLDivElement}/>
        }
    </div>)
}

