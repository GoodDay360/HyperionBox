import { BaseDirectory, readDir, mkdir, copyFile} from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';

async function copy_recursive({ src, dest, threads = 3 }:any) {
    return await new Promise(async (resolve, reject) => {
        const entries = await readDir(src, { baseDir: BaseDirectory.AppData });
        await mkdir(dest, { recursive: true, baseDir: BaseDirectory.AppData }).catch(e => { console.error(e) });

        const fileCopyPromises = [];
        let activeThreads = 0;

        for (const entry of entries) {
            const srcPath = await path.join(src, entry.name);
            const destPath = await path.join(dest, entry.name);

            if (entry.isDirectory) {
                fileCopyPromises.push(copy_recursive({ src: srcPath, dest: destPath, threads }));
            } else {
                fileCopyPromises.push(copyFile(srcPath, destPath, { fromPathBaseDir: BaseDirectory.AppData, toPathBaseDir: BaseDirectory.AppData }).catch(e => { console.error(e); reject(e) }));
            }

            activeThreads++;
            if (activeThreads >= threads) {
                await Promise.all(fileCopyPromises);
                fileCopyPromises.length = 0;  // Clear the array after processing
                activeThreads = 0;
            }
        }

        // Wait for the remaining file copy promises to complete
        await Promise.all(fileCopyPromises);

        resolve(true);
    });
}


export default copy_recursive;