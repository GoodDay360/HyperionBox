import { fetch } from '@tauri-apps/plugin-http';

async function check_internet_connection() {
    try {
        const response = await fetch('https://amionline.net/', {
            method: 'HEAD',
            mode: 'no-cors',
        });
        if (!response.ok) return false
        console.log('Internet is connected!');
        return true;
    } catch (error) {
        console.error('No internet connection.', error);
        return false;
    }
}

export default check_internet_connection;