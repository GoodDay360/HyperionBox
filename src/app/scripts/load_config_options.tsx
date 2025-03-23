
import { getCurrentWindow, currentMonitor, LogicalSize } from "@tauri-apps/api/window";
import { read_config } from "../../global/scripts/manage_config";
const load_config_options = async () => {
    const config = await read_config();
    if (!config.options) config.options = {};

    if (!config.options.fullscreen) config.options.fullscreen = false;
    await getCurrentWindow().setFullscreen(config.options.fullscreen);

    if (!config.options.fullscreen){

        if (!config.options.screen) config.options.screen = {};
        const monitor_size:any = (await currentMonitor())?.size;
        config.options.screen.height = config.options.screen?.height ? config.options.screen.height : monitor_size.height*0.5;
        config.options.screen.width = config.options.screen.width ? config.options.screen.width : monitor_size.width*0.5;
        
        await getCurrentWindow().setSize(new LogicalSize(config.options.screen.width, config.options.screen.height));
        if (config.options.maximized) {await getCurrentWindow().maximize()}
        else{await getCurrentWindow().center()};
    }
}

export default load_config_options;