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


export const change_password = async (current_password: string, new_password: string):Promise<void> => {
    const configs = await get_configs();
    return new Promise((resolve, reject) => {
        if (current_password === new_password) {
            reject("Current and new password cannot be the same.");
            return;
        }
        fetch(`${configs.hypersync_server}/api/user/change_password`,{
            method: 'POST',
            headers: {
                'Authorization': configs.hypersync_token??"",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({current_password, new_password})
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
        }).catch((e)=>{
            console.error(e);
            reject("Something went wrong while changing password.");
        })
    })
};


export const reset_hypersync_cache = async ():Promise<void> => {
    return invoke<void>('reset_hypersync_cache');
};


export const upload_all_local_favorite = async ():Promise<void> => {
    return invoke<void>('upload_all_local_favorite');
};