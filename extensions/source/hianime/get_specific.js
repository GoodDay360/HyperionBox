import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';

const get_sepcific = async (options) => {
    const url = options.url || "https://hianime.to/the-fruit-of-evolution-before-i-knew-it-my-life-had-it-made-season-2-18283"
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url);

    await page.setViewport({width: 1080, height: 1024});


    const data = await page.evaluate(()=> {
        const result = {};

        const main_wrapper = document.querySelector("#main-wrapper");
        const detial = main_wrapper.querySelector("#ani_detail");
        const content = detial.querySelector(".anis-content");
        result.info = {};
        result.info.cover = content.querySelector(".anisc-poster").querySelector("img").getAttribute("src");
        result.info.title = content.querySelector(".anisc-detail").querySelector(".film-name").textContent;
        const film_stats = content.querySelector(".anisc-detail").querySelector(".film-stats");

        result.stats = {}
        result.stats.pg = film_stats.querySelector(".tick-pg").textContent;
        result.stats.quality = film_stats.querySelector(".tick-quality").textContent;
        result.stats.sub = film_stats.querySelector(".tick-sub").textContent;
        result.stats.dub = film_stats.querySelector(".tick-dub").textContent;
        result.stats.eps = film_stats.querySelector(".tick-eps").textContent;
        
        content.querySelector(".film-description").querySelector(".text").querySelector("span").click()
        content.querySelector(".film-description").querySelector(".text").querySelector("span").remove()
        result.info.description = (content.querySelector(".film-description").querySelector(".text").textContent).trim();
        
        const film_info_wrap = content.querySelector(".anisc-info").querySelectorAll(".item");
        const name_1 = film_info_wrap[1].querySelector(".name").textContent;
        const name_2  = film_info_wrap[2].querySelector(".name").textContent;
        result.info.alternative = `${name_1} | ${name_2}`;

        result.info.aired = film_info_wrap[3].querySelector(".name").textContent;
        result.info.premiered = film_info_wrap[4].querySelector(".name").textContent;
        result.info.duration = film_info_wrap[5].querySelector(".name").textContent;
        result.info.status = film_info_wrap[6].querySelector(".name").textContent;
        
        result.info.genres = []
        film_info_wrap[8].querySelectorAll("a").forEach(el => {
            result.info.genres.push(el.getAttribute("title"))
        })

        result.info.studios = film_info_wrap[9].querySelector(".name").textContent;
        result.info.producers = film_info_wrap[10].querySelector(".name").textContent;
        
        return result;
    })

    console.log(data)
    await browser.close();
}

export default get_sepcific;