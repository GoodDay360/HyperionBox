const { spawn, spawnSync } = require('child_process');
const path = require('path');
const os = require('os');

// Ensure the program has been built
spawnSync('cargo', ['build', '--release']);

// Start tauri-driver
const tauriDriver = spawn(path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'), [], {
    stdio: [null, process.stdout, process.stderr]
});

module.exports = tauriDriver;
