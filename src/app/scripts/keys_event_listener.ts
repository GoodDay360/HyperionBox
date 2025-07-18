import { getCurrentWindow } from "@tauri-apps/api/window"
import { read_config, write_config } from "../../global/scripts/manage_config";
export const check_fullscreen = async ({fullscreen_snackbar, set_fullscreen_snackbar}:any) => {
    document.addEventListener('keydown', async function(event) {
        const config = await read_config();
        if (!Object.keys(config.options)) config.options = {};
        if (!config.options.fullscreen) config.options.fullscreen = false;
        if (event.key === 'F11') {
            sessionStorage.setItem("allow_auto_config_screen", "0");
            set_fullscreen_snackbar({
                ...fullscreen_snackbar, state: true, 
                text: config.options.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen, press F11 to exit.',
            });
            config.options.fullscreen ? await getCurrentWindow().setFullscreen(false) : await getCurrentWindow().setFullscreen(true);
            config.options.fullscreen = !config.options.fullscreen
            await write_config(config);
        }
    });
}

export const check_resize = async () => {
    var check_resize_timeout:any;

    await getCurrentWindow().onResized(({ payload: size }) => {
        clearTimeout(check_resize_timeout);
        check_resize_timeout = setTimeout(async () => {
            if (sessionStorage.getItem("allow_auto_config_screen") === "0") return;
            const config = await read_config();
            if (!config.options) config.options = {};
            
            const maximized = await getCurrentWindow().isMaximized()
            const minimized = await getCurrentWindow().isMinimized()
            if (maximized) {
                config.options.maximized = maximized
            }else if (!minimized) {
                if (!config.options.screen) config.options.screen = {};
                config.options.maximized = maximized 
                config.options.screen.height = size.height
                config.options.screen.width = size.width
            }
            await write_config(config);
        },1000);
    });
    
}
