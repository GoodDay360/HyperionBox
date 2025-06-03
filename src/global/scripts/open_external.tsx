

// Axios Imports
import axios from 'axios';

const open_external = async ({url}:any) => {
    return await new Promise<any>(async (resolve, _) => {
        try{
            const port = sessionStorage.getItem("extension_port");
            const body = {
                url
            }
            axios({
                method: 'POST',
                url: `http://localhost:${port}/request_open_external`,
                data: body,
                headers: {
                    'Content-Type': 'application/json',
                },
            }).then(async (res: any) => {
                resolve(res);
            }).catch((e: any) => {
                resolve({ code: 500, message: e });
            });    
            // =======================    
        }catch(e: any) {
            console.error(e);
            resolve({ code: 500, message: e });
        }
    })
}

export default open_external;