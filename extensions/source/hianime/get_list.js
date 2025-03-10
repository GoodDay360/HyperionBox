import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';

const get_list = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://hianime.to/filter');

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
    await browser.close();
}

export default get_list;