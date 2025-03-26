import execute_command from "../../global/scripts/excute_command"

const release_port = async (port:string|number)=> {
    const command = `netstat -ano | findstr :${port}`;
    const result = await execute_command({command:command, title:"get_extension_pid"});
    const lines = result.stdout.trim().split('\n');

    for (const line of lines.reverse()){
        const validOptions = ['LISTENING'];
        for (const option of validOptions) {
            if (line.includes(option)) {
                const pid = line.trim().split(/\s+/).at(-1);
                console.log(line.trim().split(/\s+/))
                console.log(pid);
                const kill_command = `taskkill /PID ${pid} /F`;
                console.log(kill_command)
                await execute_command({command:kill_command, title:"kill_extension_process"});
                break
            };
        }
    }
}
export default release_port;