import Hls from 'hls.js';
import type {
	LoaderContext,
	LoaderConfiguration
} from "hls.js";

import { fetch } from '@tauri-apps/plugin-http';


// Below code use a lot of any for types.
// I know this is bad but I can't find a proper type for hls.js because most document I found are in javascript.
// `this.readystatechange()` doesn't exist when I log it out but somehow callable. I don't know why.
// I got this implementation from `https://codepen.io/robwalch/pen/GRbOpaJ`
// If someone find a proper type for hls.js please let me know in pr.

const MODIFY_PLOADER = ({
	host="",
	origin="",
	referer=""
}:{
	host?:string,
	origin?:string,
	referer?:string
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
			let current_url = context.url;
			
			const headers:{
				"Host"?:string,
				"Origin"?:string,
				"Referer"?:string,
			} = {};

			if (host) {headers["Host"] = host};
			if (origin) {headers["Origin"] = origin};
			if (referer) {headers["Referer"] = referer};
			for (;;) {
				console.log("CU", current_url)
				try {
					let response = await fetch(current_url,
						{headers}
					)
					
					if ((response.url !== current_url)) {
						
						let url_obj = new URL(response.url);
						headers.Origin = "";
						headers.Host = url_obj.host;
						current_url = response.url;
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

export default MODIFY_PLOADER as any;