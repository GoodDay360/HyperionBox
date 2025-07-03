import { platform } from '@tauri-apps/plugin-os';
import { path } from '@tauri-apps/api';
import { BaseDirectory, mkdir, writeTextFile, remove } from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';

const execute_command: any = async ({
	title = "run",
	command,
	cwd = "",
	wait = true,
	spawn = true
}: any) => {
	const plat = await platform();
	const workspace = cwd || await path.appDataDir();
	let script_path: string = "";
	let shell_command: string = "";
	let system_shell: string;
	const executor_dir = await path.join(await path.appDataDir(), "executor");

	await mkdir(executor_dir, {
		recursive: true,
		baseDir: BaseDirectory.AppData
	}).catch(console.error);

	if (plat === "windows") {
		script_path = await path.join(executor_dir, `${title}.ps1`);
		await writeTextFile(script_path, `chcp 65001 >nul\n${command}`, {
			baseDir: BaseDirectory.AppData,
			create: true
		}).catch(console.error);
		system_shell = "windows-shell";
		shell_command = script_path;
	} else {
		system_shell = "unix-shell";
		shell_command = command;
	}

	const shellArg = plat === "windows" ? ["-ExecutionPolicy", "Bypass", " -File"] : ["-c"];
	console.log([...shellArg, shell_command]);
	if (wait) {
		const result = await Command.create(system_shell, [...shellArg, shell_command], {
			cwd: workspace
		}).execute();

		if (plat === "windows") {
			await remove(script_path, { baseDir: BaseDirectory.AppData }).catch(console.error);
		}

		if (result.stderr.trim()) console.error(result.stderr);
		return result;
	} else {
		const result = await Command.create(system_shell, [...shellArg, shell_command], {
			cwd: workspace
		});

		if (spawn) result.spawn();
		return result;
	}
};

export default execute_command;
