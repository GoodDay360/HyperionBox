import puppeteer from 'puppeteer';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath, pathToFileURL} from 'url'

const get_list = async (options) => {
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://hianime.to/search?keyword=${options.search || "+"}&page=${options.page || 1}`);

    await page.setViewport({width: 1080, height: 1024});

    const data = await page.evaluate(() => {
        const result = []
        
        const film_item = document.querySelector('.film_list-wrap').querySelectorAll('.flw-item');
        film_item.forEach(node => {
            item_data = {}
            const film_poster = node.querySelector(".film-poster");
            item_data.cover = film_poster.querySelector("img").getAttribute("data-src");
            
            const film_detail = node.querySelector('.film-detail')
            item_data.title = film_detail.querySelector("h3").querySelector("a").innerText
            
            item_data.link = "https://hianime.to" + film_detail.querySelector("h3").querySelector("a").getAttribute("href")
            result.push(item_data)
        })
        return result;
    })

    console.log(data);

    const jsonString = JSON.stringify(
        {
            data: data,
            status: {
                code: 200,
                message: "OK"
            }
        }
    , null, 2);

    const LOG_DIRECTORY = path.join(options.output_dir, "log");
    fs.mkdir(LOG_DIRECTORY, { recursive: true }, (err) => {
        if (err) {
            console.error('Error creating directory', err);
        } else {
            fs.writeFile(path.join(LOG_DIRECTORY, "result.json"), jsonString, (err) => {
                if (err) {
                    console.log('Error writing file', err);
                } else {
                    console.log('Successfully wrote file');
                }
            });
        }
    });
    
    

    await browser.close();
}

export default get_list;