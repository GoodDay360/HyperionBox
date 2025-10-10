// Tauri API
import { fetch } from '@tauri-apps/plugin-http';
import { readFile } from '@tauri-apps/plugin-fs';
import { normalize } from '@tauri-apps/api/path';

// Scripts Imorts


// HLS Imports
import Hls from 'hls.js';
import type {
	LoaderContext,
	LoaderConfiguration
} from "hls.js";




// Below code use a lot of any for types.
// I know this is bad but I can't find a proper type for hls.js because most document I found are in javascript.
// `this.readystatechange()` doesn't exist when I log it out but somehow callable. I don't know why.
// I got this implementation from `https://codepen.io/robwalch/pen/GRbOpaJ`
// If someone find a proper type for hls.js please let me know in pr.


/* Fragment/Segment Loader */
const MODIFY_FLOADER = ({
	host="",
	origin="",
	referer="",
	mode,
}:{
	host?:string,
	origin?:string,
	referer?:string,
	mode:"online"|"offline",
}) => {

	const BaseLoader = Hls.DefaultConfig.loader as any;
	class CustomLoader extends BaseLoader {
		config!: LoaderConfiguration;
		context!: LoaderContext;
		loader!: {
			readyState: number,
			status: number,
			statusText: string,
			responseType: string,
			response: ArrayBuffer | null,
			responseText: ArrayBuffer | string | null,
			responseURL: string,
		};

		async loadInternal() {
			const { config, context } = this;
			if (!config || !context) {
				return;
			}
			
			const headers:{
				"Host"?:string,
				"Origin"?:string,
				"Referer"?:string,
				"User-Agent":string,
				"Sec-Fetch-Site":string,
			} = {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
				"Sec-Fetch-Site": "same-origin",
			};

			let current_url = context.url;

			
			if (host) {headers["Host"] = host};
			if (origin) {headers["Origin"] = origin};
			if (referer) {headers["Referer"] = referer};
			

			for (;;) {
				console.log("FLOADER:", current_url);
				console.log("FLOADER HEADERS:", headers);
				try {
					
					if (mode === "online") {
						let response = await fetch(current_url,
							{headers}
						)
						
						if ((response.url !== current_url)) {
							
							let url_obj = new URL(response.url);
							headers.Origin = origin;
							headers.Host = url_obj.host;
							headers.Referer = referer;
							current_url = response.url;

							console.log("Redirect FLOADER:", current_url);

							continue;
						}
						const responseData = await response.arrayBuffer()
						const responseText = new TextDecoder().decode(responseData);
						
						this.loader = {
							readyState: 4,
							status: response.status,
							statusText: '',
							responseType: context.responseType,
							response: responseData,
							responseText: responseText,
							responseURL: response.url,
						};
						this.readystatechange();
					}else if (mode === "offline") {

						let file = await normalize(context.url);

						const responseData = (await readFile(file)).buffer;
						const responseText = new TextDecoder().decode(responseData);


						this.loader = {
							readyState: 4,
							status: 200,
							statusText: '',
							responseType: context.responseType,
							response: responseData,
							responseText: responseText,
							responseURL: context.url,
						};
						this.readystatechange();
					}

					break;
				}catch(error) {
					console.error(error);
					this.loader = {
						readyState: 4,
						status: 500,
						statusText: '',
						responseType: context.responseType,
						response: null,
						responseText: null,
						responseURL: current_url,
					};
					this.readystatechange();
					break
				};
			}
			
		}
	}
	return CustomLoader;
}
export default MODIFY_FLOADER as any;