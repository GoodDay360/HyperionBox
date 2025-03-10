// import { Command } from '@tauri-apps/plugin-shell';
import { info,} from '@tauri-apps/plugin-log';
// import { path } from '@tauri-apps/api';
function Home() {

    return (
        <div className="container">
            <p>HEllo</p>
            <button onClick={async () => {
                // const node_path = await path.resolveResource("../bundle/node/node.exe");
                // const source = await path.resolveResource("../bundle/source/route.js");
                // let result = await Command.create('exec-cmd', ['-c',
                //     node_path + " " + source
                // ]).execute();
                // info(result.stderr);
                // info(result.stdout);
                info("Hello")

            }}>Click</button>
        </div>
    );
}

export default Home;
