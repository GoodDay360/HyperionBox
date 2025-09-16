// Tauri Imports
import { openUrl } from '@tauri-apps/plugin-opener';
import { getCurrentWindow } from '@tauri-apps/api/window';

// SolidJS Router Imports
import { onMount, onCleanup } from 'solid-js';
import { Route, Router  } from "@solidjs/router";

// SUID Imports
import { createTheme, ThemeProvider } from "@suid/material/styles";

// Solid Toast
import { Toaster } from 'solid-toast';


// Style Imports
import 'bootstrap/dist/css/bootstrap.min.css';

import "../styles/app.css";

// Component Imports
import Home from "@src/home/components/home";
import TitleBar from '@src/app/components/titlebar';


const theme = createTheme({
    typography: {
        fontFamily: 'var(--font-family)',
    },
});

export default function App() {
    const appWindow = getCurrentWindow();

    let TitleBarRef!: HTMLElement;

    onMount(()=>{
        function on_resize() {
            document.documentElement.style.setProperty('--inner-width', `${window.innerWidth}px`);
            document.documentElement.style.setProperty('--inner-height', `${window.innerHeight - (TitleBarRef?.clientHeight ?? 0)}px`);
        }

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

            <TitleBar ref={TitleBarRef} />
            <Router>
                <Route path="/" component={Home} />
            </Router>
        </div>
        
    </ThemeProvider>)
}

