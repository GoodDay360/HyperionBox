
const get_extension_directory = new Promise<any>(async (resolve, reject) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            resolve(import.meta.env.VITE_DEV_EXTENSIONS_DIRECTORY);
        } else {
            console.error("Not setup yet;")
            reject("Not setup yet;")
        }

    } catch (e) { 
        console.error(e)
        reject("Internal Error");
    }
})

export default get_extension_directory;