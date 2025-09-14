// Tauri Imports
import { openUrl } from '@tauri-apps/plugin-opener';

// SolidJS Router Imports
import { onMount } from 'solid-js';
import { Route } from "@solidjs/router";


// SUID Imports
import { createTheme, ThemeProvider } from "@suid/material/styles";



// Style Imports
import 'bootstrap/dist/css/bootstrap.min.css';
import "../styles/app.css";

// Component Imports
import Home from "@src/home/components/home";



const theme = createTheme({
    typography: {
        fontFamily: 'var(--font-family)',
    },
});

export default function App() {

    onMount(() => { 
        window.open = function (
            url?: string | URL,
            _target?: string,
            _features?: string
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
        <Route path="/" component={Home} />
    </ThemeProvider>)
}

