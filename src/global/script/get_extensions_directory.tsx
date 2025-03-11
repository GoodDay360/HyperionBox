import {error} from '@tauri-apps/plugin-log';

export const get_extensions_directory: () => string = () => {
    try {
        if (process.env.NODE_ENV === 'development') {
            return import.meta.env.VITE_DEV_EXTENSIONS_DIRECTORY;
        } else {
            error("Not setup yet;")
            return "";
        }

    } catch (e:unknown) { 
        if (e instanceof Error) {
            error(e.message);
        } else {
            error("An unknown error occurred");
        }
        return "";
    }

}