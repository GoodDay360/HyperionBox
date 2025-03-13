
import { platform } from '@tauri-apps/plugin-os';
import { path } from '@tauri-apps/api';
import { BaseDirectory, mkdir, writeTextFile, remove} from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';

const execute_command:any = async ({title="run",command,cwd=""}:any) => {
    const plat = await platform()

    if (plat === "windows"){
        const executor_dir = await path.join(await path.appDataDir(), "executor");
        await mkdir(executor_dir, {recursive:true,baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});
        const executor_path = await path.join(executor_dir, `${title}.bat`);
        await writeTextFile(executor_path, command, {baseDir:BaseDirectory.AppData, create:true}).catch(e=>{console.error(e)});
        const workspace = cwd || await path.appDataDir() ;
        let result = await Command.create('windows-shell', [
            '/c',
            executor_path
        ],{cwd:workspace}).execute();

        await remove(executor_path, {baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});

        return result;

    }
}

export default execute_command;