// Tauri Imports
import { getCurrentWindow } from '@tauri-apps/api/window';

// SolidJS Imports
import { onMount, onCleanup, createContext, createSignal } from 'solid-js';
import { Route, Router  } from "@solidjs/router";


// SUID Imports
import { createTheme, ThemeProvider } from "@suid/material/styles";

// Solid Toast
import { Toaster, toast } from 'solid-toast';


// Style Imports
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import "../styles/app.css";

// Component Imports

import TitleBar from '@src/app/components/titlebar';
import Plugin from '@src/plugins/components/plugins';
import Home from "@src/home/components/home";
import Favorites from '@src/favorites/components/favorites';
import Search from '@src/search/components/search';
import View from '@src/view/components/view';
import Watch from '@src/watch/components/watch';
import ManageFavorite from '@src/manage_favorite/components/manage_favorite';
import Downloads from '@src/downloads/components/downloads';




const theme = createTheme({
    typography: {
        fontFamily: 'var(--font-family)',
    },
});

export const ContextManager = createContext<{
    screen_size: () => {
        width: number;
        height: number;
    }
}>();

export default function App() {
    const appWindow = getCurrentWindow();

    let SafeAreaProbeRef !: HTMLDivElement;

    let TitleBarRef!: HTMLElement;

    const [is_enter_fullscreen, set_is_enter_fullscreen] = createSignal(false);

    const [safe_area, set_safe_area] = createSignal({top: 0, bottom: 0, left: 0, right: 0});
    const [screen_size, set_screen_size] = createSignal({width: 0, height: 0});
    

    function on_resize() {
        document.documentElement.style.setProperty('--inner-width', `${window.innerWidth}px`);
        document.documentElement.style.setProperty('--inner-height', `${window.innerHeight - (TitleBarRef?.clientHeight ?? 0)}px`);
        set_screen_size({width: window.innerWidth, height: window.innerHeight - (TitleBarRef?.clientHeight ?? 0)});
    }


    onMount(()=>{
        document.addEventListener('keydown', async function(event) {
            if (event.key === 'F11') {
                toast.remove();
                if (await appWindow.isFullscreen()) {
                    await appWindow.setFullscreen(false);
                    set_is_enter_fullscreen(false);
                    toast("Exited fullscreen. F11 toggles fullscreen.", {style: {color: "cyan"}});
                }else{
                    await appWindow.unmaximize();
                    await appWindow.setFullscreen(true);
                    set_is_enter_fullscreen(true);
                    toast("Entered fullscreen. F11 toggles fullscreen.", {style: {color: "cyan"}});
                    
                }
                on_resize();
            }
        });

    })

    onMount(()=>{
        appWindow.onResized(on_resize);
        on_resize();
        window.addEventListener('resize', on_resize);

        onCleanup(() => {
            window.removeEventListener('resize', on_resize);
        });
    })

    onMount(() => { 
        const style = window.getComputedStyle(SafeAreaProbeRef);

        set_safe_area({
            top: parseInt(style.paddingTop),
            bottom: parseInt(style.paddingBottom),
            left: parseInt(style.paddingLeft),
            right: parseInt(style.paddingRight),
        });

        document.documentElement.style.setProperty('--safe-area-top', `${safe_area().top}px`);
        document.documentElement.style.setProperty('--safe-area-bottom', `${safe_area().bottom}px`);
        document.documentElement.style.setProperty('--safe-area-left', `${safe_area().left}px`);
        document.documentElement.style.setProperty('--safe-area-right', `${safe_area().right}px`);

    })

    return (<ThemeProvider theme={theme}>
        <ContextManager.Provider value={{
            screen_size
        }}>
            <Toaster 
                position="bottom-center"
                gutter={5}
                toastOptions={{
                    duration: 5000,
                    style: {
                        border:"2px solid var(--background-1)",
                        background: 'var(--background-2)',
                        color: "var(--color-1)",
                        "font-family": "var(--font-family)",
                        "margin-bottom": "env(safe-area-inset-bottom, 0)"
                    },
                }}
            />
            <div id="safe-area-probe" ref={SafeAreaProbeRef}/>

            <div class="app">
                {!is_enter_fullscreen() &&
                    <TitleBar ref={TitleBarRef} />
                }
                <Router>
                    <Route path="/" component={Home} />
                    <Route path="/favorites" component={Favorites} />
                    <Route path="/downloads" component={Downloads} />
                    <Route path="/search" component={Search} />
                    <Route path="/view" component={View} />
                    <Route path="/watch" component={Watch} />
                    <Route path="/plugin" component={Plugin} />
                    <Route path="/manage_favorite" component={ManageFavorite} />
                </Router>
            </div>
    </ContextManager.Provider>
    </ThemeProvider>)
}

