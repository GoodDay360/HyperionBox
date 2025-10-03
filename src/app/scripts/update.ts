// Tauri API
import { getVersion } from '@tauri-apps/api/app'
import { fetch } from '@tauri-apps/plugin-http';

// Type Imports
import { Update, CheckUpdate } from '../types/update_type';

// Semver Imports
import semver from 'semver';

export const check_update = async ():Promise<CheckUpdate> => {
    try {
        const res = await fetch("https://github.com/GoodDay360/HyperionBox/releases/latest/download/latest.json");

        const data:Update = await res.json();

        return {
            state: semver.gt(data.version, await getVersion()),
            version: data.version,
            notes: data.notes
        }
        
    }catch (e) {
        console.error(e);
        return {state: false, version: "", notes: ""};
    }

    
};