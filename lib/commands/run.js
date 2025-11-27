const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const ora = require('ora');

const run = async () => {
    logger.info('Starting sumjs development environment...');

    const reactSrcPath = path.join(process.cwd(), 'react-src');
    if (!fs.existsSync(reactSrcPath)) {
        logger.error('react-src directory not found! Are you in the root of your project?');
        process.exit(1);
    }

    // Start React Dev Server
    logger.info('Starting React dev server...');
    const spinner = ora('Waiting for React dev server...').start();

    const devServer = shell.exec('cd react-src && npm run dev', { async: true, silent: false });

    // Simple wait (in a real app, we'd poll the port)
    await new Promise(resolve => setTimeout(resolve, 5000));
    spinner.succeed('React dev server started!');

    // Start sumjs app
    logger.info('Starting sumjs app...');

    // Workaround: neu CLI requires neutralino.config.json
    const sumConfigPath = path.join(process.cwd(), 'sum.config.json');
    const neuConfigPath = path.join(process.cwd(), 'neutralino.config.json');
    let renamed = false;

    if (fs.existsSync(sumConfigPath)) {
        fs.renameSync(sumConfigPath, neuConfigPath);
        renamed = true;
    }

    const cleanup = () => {
        if (renamed && fs.existsSync(neuConfigPath)) {
            try {
                fs.renameSync(neuConfigPath, sumConfigPath);
                renamed = false;
            } catch (e) {
                // Ignore if file locked or missing
            }
        }
    };

    // Handle exit
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
        cleanup();
        process.exit();
    });
    process.on('uncaughtException', (e) => {
        console.error(e);
        cleanup();
        process.exit(1);
    });

    try {
        const { spawn } = require('child_process');

        // Determine binary name based on OS/Arch
        let binaryName = '';
        const platform = process.platform;
        const arch = process.arch;

        if (platform === 'win32') {
            binaryName = 'suman-win_x64.exe';
        } else if (platform === 'linux') {
            binaryName = arch === 'arm64' ? 'suman-linux_arm64' : 'suman-linux_x64';
        } else if (platform === 'darwin') {
            binaryName = arch === 'arm64' ? 'suman-mac_arm64' : 'suman-mac_x64';
        }

        const binaryPath = path.join(process.cwd(), 'bin', binaryName);

        if (!fs.existsSync(binaryPath)) {
            logger.error(`Binary not found: ${binaryName}`);
            process.exit(1);
        }

        // Arguments for development mode
        const args = [
            '--load-dir-res',
            '--path=.',
            '--export-auth-info',
            '--neu-dev-extension',
            '--neu-dev-auto-reload'
        ];

        // Quote path if it contains spaces
        const command = `"${binaryPath}"`;
        const child = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'], shell: true });

        child.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                if (!line.includes('neu: INFO')) {
                    console.log(line);
                }
            });
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        // Wait for child to exit
        await new Promise((resolve) => {
            child.on('close', resolve);
        });
    } finally {
        cleanup();
    }
};

module.exports = run;
