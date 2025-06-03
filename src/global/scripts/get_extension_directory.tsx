import { path } from '@tauri-apps/api';

const get_extension_directory = new Promise<any>(async (resolve, reject) => {
    try {
        if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_DEV_USE_CUSTOM_EXTENSIONS_DIRECTORY === "1") {
            resolve(import.meta.env.VITE_DEV_EXTENSIONS_DIRECTORY);
        } else {
            resolve(await path.join(await path.appDataDir(), "extension"));
        }

    } catch (e) { 
        console.error(e)
        reject("Internal Error");
    }
})

export default get_extension_directory;