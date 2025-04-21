

// Axios Imports
import axios from 'axios';


// Custom Imports
import write_crash_log from '../../global/scripts/write_crash_log';

const shutdown_extension = async () => {
    return await new Promise<any>(async (resolve, _) => {
        try{
            const port = sessionStorage.getItem("extension_port");
            axios({
                method: 'POST',
                url: `http://localhost:${port}/shutdown`,
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 3000,
            }).then(async (_) => {
                resolve({ code: 200, message: "Server is shutting down..." });
            }).catch(async (e: any) => {
                console.error(e);
                await write_crash_log(JSON.stringify(e));
                resolve({ code: 500, message: e });
            });        
        }catch(e: any) {
            console.error(e);
            await write_crash_log(JSON.stringify(e));
            resolve({ code: 500, message: e });
        }
    })
}

export default shutdown_extension;