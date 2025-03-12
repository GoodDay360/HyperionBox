import { platform } from '@tauri-apps/plugin-os';

const get_platform_file_extensions = async ():Promise<string> => {
    const plat = await platform();
    if (plat === "windows"){
        return ".exe";
    }else if (plat === "linux"){
        return "";
    }else{
        console.error("Unkown platform")
        throw "Unkown platform";
    }
}

export default get_platform_file_extensions;