// Tauri API
import { readFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

// Scripts Imorts
import { get_configs } from '@src/settings/scripts/settings';

// HLS Imports
import Hls from 'hls.js';
import type {
	LoaderContext,
	LoaderConfiguration
} from "hls.js";


// Types Imports
import { GetPlaylistResponse } from '../types/modify_loader';



// Below code use a lot of any for types.
// I know this is bad but I can't find a proper type for hls.js because most document I found are in javascript.
// `this.readystatechange()` doesn't exist when I log it out but somehow callable. I don't know why.
// I got this implementation from `https://codepen.io/robwalch/pen/GRbOpaJ`
// If someone find a proper type for hls.js please let me know in pr.

const MODIFY_PLOADER = ({
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
			
			
			const headers = {
				"host": host||null,
				"origin": origin||null,
				"referer": referer||null
			};
			
			const current_url = context.url;
			
			console.log("PLOADER:", current_url);
			console.log("PLOADER REQUEST HEADERS:", headers)
			try {
				if (mode === "online") {
					let response = await invoke<GetPlaylistResponse>("get_playlist", { url: current_url , headers });

					console.log("PLOADER RESPONSE:", response);

					let raw_data = new Uint8Array(response.data);
					
					const responseData = raw_data.buffer;
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
					const app_configs = await get_configs();
					let storage_dir = app_configs.storage_dir;
					const file = await join(storage_dir, context.url);
					console.log("Local-PLOADER", file)

					const responseData = (await readFile(file)).buffer;
					const responseText = new TextDecoder().decode(responseData);


					this.loader = {
						readyState: 4,
						status: 200,
						statusText: '',
						responseType: context.responseType,
						response: responseData,
						responseText: responseText,
						responseURL: `${storage_dir}/`,
					};
					this.readystatechange();
				}

				
			}catch(error) {
				console.error("PLOADER ERROR: ",error);
				this.loader = {
					readyState: 4,
					status: 500,
					statusText: '',
					responseType: context.responseType,
					response: null,
					responseText: null,
					responseURL: context.url,
				};
				this.readystatechange();
				
			};
			
			
		}
	}

	return CustomLoader;
}

export default MODIFY_PLOADER as any;