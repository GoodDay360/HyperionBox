import get_list from './get_list.js';
import get_sepcific from './get_specific.js';

const main = async (options) => {
    const method = options.method
    if (!method) {console.error("Missing 'method' argument."); return;}
    else if (method === "get_list") {await get_list(options);}
    else if (method === "get_specific") {await get_sepcific(options)}
    else {console.error("Unkown method!");}
}

export default main;