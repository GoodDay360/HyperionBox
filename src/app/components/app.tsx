// Tauri Imports
import { openUrl } from '@tauri-apps/plugin-opener';
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
import "../styles/app.css";

// Component Imports
import TitleBar from '@src/app/components/titlebar';
import Home from "@src/home/components/home";
import Search from '@src/search/components/search';
import View from '@src/view/components/view';


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

    let TitleBarRef!: HTMLElement;

    const [is_enter_fullscreen, set_is_enter_fullscreen] = createSignal(false);

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
        
        window.open = function (
            url?: string | URL,
        ): Window | null {
            if (typeof url === 'string' || url instanceof URL) {
                openUrl(url.toString());
            } else {
                console.warn('window.open called without a valid URL');
            }

            // Return null to mimic the original behavior
            return null;
        };
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
                    },
                }}
            />

            <div class="app">
                {!is_enter_fullscreen() &&
                    <TitleBar ref={TitleBarRef} />
                }
                <Router>
                    {/* <Route path="/" component={Home} /> */}
                    <Route path="/search" component={Search} />
                    <Route path="/" component={View} />
                </Router>
            </div>
    </ContextManager.Provider>
    </ThemeProvider>)
}

