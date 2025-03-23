
import { platform } from '@tauri-apps/plugin-os';
import { path } from '@tauri-apps/api';
import { BaseDirectory, mkdir, writeTextFile, remove} from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';

const execute_command:any = async ({title="run",command,cwd="", wait=true}:any) => {
    const plat = await platform()
    const workspace = cwd || await path.appDataDir() ;
    let result_command:string = "";
    if (plat === "windows"){
        const executor_dir = await path.join(await path.appDataDir(), "executor");
        await mkdir(executor_dir, {recursive:true,baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});
        result_command = await path.join(executor_dir, `${title}.bat`);
        await writeTextFile(result_command, command, {baseDir:BaseDirectory.AppData, create:true}).catch(e=>{console.error(e)});
        
    }
    
    if (wait){
        let result = await Command.create('windows-shell', [
            '/c',
            result_command
        ],{cwd:workspace}).execute();

        await remove(result_command, {baseDir:BaseDirectory.AppData}).catch(e=>{console.error(e)});
        if (result.stderr.trim()) console.error(result.stderr);
        return result;
    }else{
        let result = await Command.create('windows-shell', [
            '/c',
            result_command
        ],{cwd:workspace}).spawn();
        return result;
    }

    
}

export default execute_command;