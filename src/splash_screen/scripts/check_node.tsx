import { fetch } from '@tauri-apps/plugin-http'
import { info, error } from '@tauri-apps/plugin-log';
import { platform, arch } from '@tauri-apps/plugin-os';
import { resolve } from 'path';


const check_node = async ({setFeedback}:any) => {
    info(await arch() + await platform())

    setFeedback("Downloading Node...")

    const manifest:any = await new Promise((resolve,reject)=>{
        fetch("https://raw.githubusercontent.com/GoodDay360/HyperionBox/refs/heads/main/manifest.json", {
            method: 'GET'
        })
        .then(async (res)=>{
            const DATA = await res.json()
            resolve(DATA)
        })
        .catch((e)=>{
            error(e)
            reject(e)
        })
    })
    const node = manifest?.files?.node;

    const node_url = node?.[await platform()]?.[await arch()];
    if (!node_url) setFeedback("Your system doesn't support this app.")
    info(node_url)

    // axios({
    //     url: "https://raw.githubusercontent.com/GoodDay360/HyperionBox/refs/heads/main/manifest.json",
    //     method: "get"
    // })
    // .then(async (response) => {
    //     const node_manifest = response.data.files.node;

    //     const node_url = node_manifest?.[await platform()]?.[await arch()];
    //     if (!node_url) setFeedback("Your system doesn't support this app.")
    //     info(node_url)



    // })
    // .catch(error => {
    //     console.error('Error fetching the data:', error);
    // });
}

export default check_node;