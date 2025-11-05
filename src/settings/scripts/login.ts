// Tauri API
import { invoke } from '@tauri-apps/api/core';
import { fetch } from '@tauri-apps/plugin-http';

// Types Imports
import { Configs } from '../types/settings_type';

// Scripts Imports
import { get_configs, set_configs } from './settings';

export const login = async (email: string, password: string):Promise<void> => {
    const configs = await get_configs();
    return new Promise((resolve, reject) => {
        fetch(`${configs.hypersync_server}/api/user/login`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email, password})
        }).then(async (res)=>{
            if (res.status === 200) {
                const data = await res.json();
                const token = data.token;
                const new_configs: Configs = {...configs, hypersync_token: token};
                await set_configs(new_configs);
                resolve();
            }else{
                const e_data = await res.json()
                reject(e_data.message);
            }
        }).catch(()=>{
            reject("Something went wrong while logging in.");
        })
    })
};
