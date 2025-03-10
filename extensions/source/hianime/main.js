import puppeteer from 'puppeteer';
import get_list from './get_list.js';
import get_sepcific from './get_specific.js';
// Or import puppeteer from 'puppeteer-core';

const main = async (options) => {
    const method = options.method
    if (!method) {console.error("Method not exist!"); return;}
    else if (method === "get_list") {await get_list();}
    else if (method === "get_specific") {await get_sepcific(options)}
}

export default main;