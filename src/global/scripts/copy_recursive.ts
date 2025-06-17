import { BaseDirectory, readDir, mkdir, copyFile } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';

const copy_recursive = async ({
  src,
  dest,
  threads = 3,
}: {
  src: string;
  dest: string;
  threads?: number;
}): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const queue: Array<{ src: string; dest: string }> = [{ src, dest }];
    let errorOccurred = false;

    const worker = async () => {
      while (queue.length > 0 && !errorOccurred) {
        const { src, dest } = queue.shift()!;
        try {
          const entries = await readDir(src, { baseDir: BaseDirectory.AppData });
          await mkdir(dest, { recursive: true, baseDir: BaseDirectory.AppData });

          for (const entry of entries) {
            const srcPath = await path.join(src, entry.name);
            const destPath = await path.join(dest, entry.name);

            if (entry.isDirectory) {
              queue.push({ src: srcPath, dest: destPath });
            } else {
              await copyFile(srcPath, destPath, {
                fromPathBaseDir: BaseDirectory.AppData,
                toPathBaseDir: BaseDirectory.AppData,
              });
            }
          }
        } catch (err) {
          errorOccurred = true;
          reject(err);
        }
      }
    };

    const workers = Array.from({ length: threads }, () => worker());

    try {
      await Promise.all(workers);
      if (!errorOccurred) resolve();
    } catch (_) {
      // already rejected inside worker
    }
  });
};

export default copy_recursive;
