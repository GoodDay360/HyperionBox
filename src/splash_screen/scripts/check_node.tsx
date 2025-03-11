import axios from "axios";
import { info, error } from '@tauri-apps/plugin-log';
import { platform, arch } from '@tauri-apps/plugin-os';


const check_node = async ({setFeedback}:any) => {
    info(await arch() + await platform())

    setFeedback("Downloading Node...")
    axios({
        url: "https://raw.githubusercontent.com/GoodDay360/HyperionBox/refs/heads/main/manifest.json",
        method: "get"
    })
    .then(async (response) => {
        const node_manifest = response.data.node;

        const node_url = node_manifest?.[await platform()]?.[await arch()];
        if (!node_url) setFeedback("Your system doesn't support this app.")
        info(node_url)



    })
    .catch(error => {
        console.error('Error fetching the data:', error);
    });
}

export default check_node;