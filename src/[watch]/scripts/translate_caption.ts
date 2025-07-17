import { fetch } from "@tauri-apps/plugin-http";
import { BaseDirectory, exists, readTextFile, mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import webvtt from 'node-webvtt';
import { Translator } from 'google-translate-api-x';
import { path } from "@tauri-apps/api";

// Custom Import
import { get_data_storage_dir } from "../../global/scripts/manage_data_storage_dir";

function isURL(str: string) {
    try {
        const url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
        return false; // Invalid URL means it's likely a path
    }
}

function splitMultilingualText({
    text,
    wordsPerLine = 10,
    lang = 'en',
}: {
    text: string;
    wordsPerLine?: number;
    lang?: string;
}): string {
    if (text.split("\n").length > 1) return text;

    // @ts-expect-error
    const segmenter = new Intl.Segmenter(lang, { granularity: 'word' });
    const segments: string[] = [];

    for (const { segment } of segmenter.segment(text)) {
        const trimmed = segment.trim();
        if (trimmed) segments.push(trimmed);
    }

    const lines: string[] = [];
    for (let i = 0; i < segments.length; i += wordsPerLine) {
        lines.push(segments.slice(i, i + wordsPerLine).join(' '));
    }

    return lines.join('\n');
}



const get_caption = async (path:string) => {
    try{
        if (isURL(path)){
            const controller = new AbortController();
            const signal = controller.signal;
            const response = await fetch(path, {
                signal
            });

            const set_timeout = setTimeout(() => controller.abort(), 10000);

            if (!response.ok) {
                return { code: 500, message: `HTTP error! Status: ${response.status}` };
            }
            clearTimeout(set_timeout)

            return {code:200, data: await response.text()};
        }else{
            const data = await readTextFile(path,{baseDir:BaseDirectory.AppData})
            return {code:200, data};
        }
    }catch(e){
        console.error(e);
        return {code:500, message:"Internal Error"};
    }
    
}

const request_translate = async ({from, to, texts}:{from:string, to:string, texts:string[]}) => {
    try{
        const translator = new Translator({
            from, to, forceBatch: true, autoCorrect: true,

            requestFunction: (url:string, requestOptions:any) => {
                return fetch(url, {
                    ...requestOptions,
                    referrer:"https://www.google.com/",
                    headers: {
                        ...requestOptions.headers,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.127 Safari/537.36',
                    }
                });
            }
        });

        const response = await translator.translate(texts);
        return {code:200, data:response};

    }catch(e){
        console.error(e);
        return {code:500, message:"Internal Error"};
    }
}


const translate_caption = async ({
    source_id,preview_id,season_id,watch_id,
    selected_translate_from,selected_translate_to,selected_installed_source
}:any) => {
    const translated_track_dir = await path.join(await get_data_storage_dir(), source_id, preview_id, season_id, "download", watch_id, "translated_track");
    if (!await exists(translated_track_dir)) await mkdir(translated_track_dir, {baseDir:BaseDirectory.AppData, recursive:true});
    const translated_track_manifest_path  = await path.join(translated_track_dir, "manifest.json")

    let translated_track_manifest
    if (await exists(translated_track_manifest_path)){
        try{
            translated_track_manifest = JSON.parse(await readTextFile(translated_track_manifest_path, {baseDir:BaseDirectory.AppData}));
        }catch(e){
            translated_track_manifest = [];
        }
    }else{
        translated_track_manifest = [];
    }

    const is_exist = translated_track_manifest.find((item:any) => item.id === selected_translate_to.value);
    if (is_exist) return {code:409, message:"Target language already exist!"}

    const get_caption_result:any = await get_caption(selected_installed_source.url);

    
    if (get_caption_result.code !== 200) return get_caption_result;

    const parsed = webvtt.parse(get_caption_result.data,{ meta: true });
    const CLEANED_UP_TEXT_ARRAY:string[] = []
    const test_char_regex = /^[A-Za-z0-9\s,]+$/;
    for (const cue of parsed.cues){
        
        let cleaned_text = "";
        const splited_text = cue.text.split("\n");
        let checked_char = [false, false]; // Check last charactor of splited first and first charactor of splited second.
        // Testing charactor
        if (splited_text.length > 1) {
            if (splited_text[0].length > 0 && test_char_regex.test(splited_text[0].charAt(splited_text[0].length - 1))){
                checked_char[0] = true;
            }
            if (splited_text[1].length > 0 && test_char_regex.test(splited_text[1].charAt(0))){
                checked_char[1] = true;
            }
        }

        if (checked_char[0] && checked_char[1]){
            cleaned_text = cue.text.split("\n").join(" ");
        }else{
            cleaned_text = cue.text;
        }

        CLEANED_UP_TEXT_ARRAY.push(cleaned_text.replace(/<[^>]*>/g, ''));
        
    }

    
    let BATCHED_TEXT:string[][] = [];
    let BATCHED_TEXT_SIZE = 0;
    let count = 0;
    BATCHED_TEXT.push([]);
    for (const text of CLEANED_UP_TEXT_ARRAY){
        BATCHED_TEXT_SIZE += (text.trim()).length;
        if (BATCHED_TEXT_SIZE < 4000){
            BATCHED_TEXT[count].push(text.trim());
        }else{
            // Reset and add remain text.
            count ++;
            BATCHED_TEXT_SIZE = (text.trim()).length;
            BATCHED_TEXT.push([text.trim()]);
        }
    }
    
    const TRANSLATED_RESULT:string[] = [];

    for (const batch of BATCHED_TEXT){
        const translate_result:any = await request_translate({from:selected_translate_from.value, to:selected_translate_to.value, texts:batch});
        if (translate_result.code !== 200) {
            console.error(translate_result)
            return translate_result;
        }
        const data = translate_result.data.map((obj:any) => obj.text)
        TRANSLATED_RESULT.push(...data);
    }

    let cue_count = 0;
    for (const cue of parsed.cues){
        cue.text = splitMultilingualText({
            text: TRANSLATED_RESULT[cue_count],
            wordsPerLine: 7,
            lang: selected_translate_to.value,
        });
        cue_count++;
    }

    const vtt_path = await path.join(translated_track_dir, `${selected_translate_to.value}.vtt`);

    const compiled_result = webvtt.compile(parsed);
    await writeTextFile(vtt_path, compiled_result, {baseDir:BaseDirectory.AppData, create:true});


    translated_track_manifest.push({
        id:selected_translate_to.value,
        url:vtt_path,
        label:selected_translate_to.label,
        kind:"captions"
    });
    await writeTextFile(translated_track_manifest_path, JSON.stringify(translated_track_manifest, null, 2), {baseDir:BaseDirectory.AppData, create:true});

    return {code:200, message:"OK"};


}

export default translate_caption;