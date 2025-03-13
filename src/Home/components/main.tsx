

// Tauri Plugins
import { Command } from '@tauri-apps/plugin-shell';
import { info, error } from '@tauri-apps/plugin-log';
import { path } from '@tauri-apps/api';
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';




// Custom imports
import { get_extensions_directory } from '../../global/script/get_extensions_directory';

function Home() {

    return (
        <div className="container">
            <p>HEllo</p>
            <button onClick={async () => {
                try{
                    info(await path.appDataDir())
                    const node_path = await path.join(get_extensions_directory(), "node", "node.exe");
                    const source = await path.join(get_extensions_directory(), "sources", "route.js");

                    const options = [
                        `--source`, `"hianime"`,
                        `--method`, `"get_list"`,
                        `--output_dir`, `"${await path.appDataDir()}"`

                    ];

                    let result = await Command.create('exec', ['-c',
                        `${node_path} ${source} ${options.join(' ')}`
                    ]).execute();

                    info(result.stderr);
                    error(result.stderr);


                    readTextFile(
                        await path.join(await path.appDataDir(), "log", "result.json"), 
                        {
                            baseDir: BaseDirectory.AppData,
                        }
                        
                    ).then((result) => {
                        info(result);
                    })
                    .catch((e) => {
                        info(e);
                    });
                    
                    
                    info("opened")
                    // const stat = await file.stat();
                    // const buf = new Uint8Array(stat.size);
                    // await file.read(buf);
                    // const textContents = new TextDecoder().decode(buf);
                    // await file.close();

                    // info(textContents);

                }catch(e:unknown){
                    if (e instanceof Error) {
                        // Log the error message if it's an instance of Error
                        error(e.message);
                    } else {
                        // Handle other types of errors (if necessary)
                        error('An unknown error occurred');
                    }
                }
            }}>Click</button>
        </div>
    );
}

export default Home;
