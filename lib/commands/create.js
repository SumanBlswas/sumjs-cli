const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const ora = require('ora');
const chalk = require('chalk');

const create = async (projectName) => {
    if (!projectName) {
        logger.error('Please provide a project name: sumjs create <projectName>');
        process.exit(1);
    }

    const projectPath = path.join(process.cwd(), projectName);
    if (fs.existsSync(projectPath)) {
        logger.error(`Directory ${projectName} already exists!`);
        process.exit(1);
    }

    logger.info(`Initializing sumjs project: ${projectName}...`);

    // 1. Scaffold sumjs core
    const spinner = ora('Setting up sumjs core...').start();
    const getNeuPath = require('../utils/neu');
    const neu = getNeuPath();

    if (shell.exec(`"${neu}" create ${projectName}`, { silent: true }).code !== 0) {
        spinner.fail('Failed to create app. Is "neu" installed?');
        process.exit(1);
    }
    spinner.succeed('sumjs core initialized!');

    // 2. Rebrand Neutralino -> sumjs
    logger.info('Applying sumjs branding...');
    try {
        // Rename config
        const oldConfigPath = path.join(projectPath, 'neutralino.config.json');
        const newConfigPath = path.join(projectPath, 'sum.config.json');

        if (fs.existsSync(oldConfigPath)) {
            fs.renameSync(oldConfigPath, newConfigPath);
        }

        // Rename client lib
        const clientLibPath = path.join(projectPath, 'resources', 'js', 'neutralino.js');
        const newClientLibPath = path.join(projectPath, 'resources', 'js', 'sum.js');
        if (fs.existsSync(clientLibPath)) {
            fs.renameSync(clientLibPath, newClientLibPath);
        }

        // Update index.html
        const indexPath = path.join(projectPath, 'resources', 'index.html');
        if (fs.existsSync(indexPath)) {
            let indexContent = fs.readFileSync(indexPath, 'utf8');
            indexContent = indexContent.replace('neutralino.js', 'sum.js');
            indexContent = indexContent.replace('Neutralino.init()', 'Neutralino.init()');
            fs.writeFileSync(indexPath, indexContent);
        }

        logger.success('Branding applied.');
    } catch (e) {
        logger.error('Failed to apply branding: ' + e.message);
    }

    // 3. Scaffold React (Vite)
    logger.info('Integrating React frontend...');
    const reactSpinner = ora('Setting up React engine...').start();

    // Navigate into project for shell commands
    shell.cd(projectPath);

    // Create react-src using Vite
    if (shell.exec('npm create vite@latest react-src -- --template react-ts', { silent: true }).code !== 0) {
        reactSpinner.fail('Failed to create React app.');
        process.exit(1);
    }
    reactSpinner.succeed('React engine ready!');

    // 4. Configure sumjs
    logger.info('Configuring sumjs environment...');
    const configPath = path.join(projectPath, 'sum.config.json');
    try {
        // Use fs.readFileSync instead of require to avoid caching issues and path confusion
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Update config for React development
        config.url = "http://localhost:5173"; // Vite default port
        config.documentRoot = "/resources/";

        // Update client library path in config
        if (config.cli) {
            config.cli.clientLibrary = "/resources/js/sum.js";
            config.cli.binaryName = projectName;
        }

        // Rebrand Application ID
        config.applicationId = `com.sumjs.${projectName}`;

        // Rebrand Chrome mode args
        if (config.modes && config.modes.chrome) {
            config.modes.chrome.args = "--user-agent=\"sumjs chrome mode\"";
        }

        // Disable logging
        if (config.logging) {
            config.logging.enabled = false;
            config.logging.writeToLogFile = false;
        }

        // Enable native API for React
        if (!config.nativeAllowList) config.nativeAllowList = [];
        if (!config.nativeAllowList.includes('app.*')) config.nativeAllowList.push('app.*');
        if (!config.nativeAllowList.includes('os.*')) config.nativeAllowList.push('os.*');
        if (!config.nativeAllowList.includes('window.*')) config.nativeAllowList.push('window.*');

        // Ensure exitProcessOnClose is true
        if (config.modes && config.modes.window) {
            config.modes.window.exitProcessOnClose = true;
            config.modes.window.icon = "/resources/icons/appIcon.png";
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        logger.success('sumjs environment configured.');

        // Cleanup unwanted files
        const filesToRemove = ['.github', 'LICENSE', 'README.md', 'neutralinojs.log'];
        filesToRemove.forEach(file => {
            const filePath = path.join(projectPath, file);
            if (fs.existsSync(filePath)) {
                shell.rm('-rf', filePath);
            }
        });

        // Update App.tsx
        const appTsxPath = path.join(projectPath, 'react-src', 'src', 'App.tsx');
        if (fs.existsSync(appTsxPath)) {
            let appContent = fs.readFileSync(appTsxPath, 'utf8');
            appContent = appContent.replace('Vite + React', 'Vite + React + SumJS');
            fs.writeFileSync(appTsxPath, appContent);
        }

        // Update .gitignore
        const gitignorePath = path.join(projectPath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            gitignoreContent = gitignoreContent.replace(/Neutralinojs/g, 'sumjs');
            gitignoreContent = gitignoreContent.replace('neutralino.js', 'sum.js');
            fs.writeFileSync(gitignorePath, gitignoreContent);
        }

        // Rename binaries in bin/
        const binPath = path.join(projectPath, 'bin');
        if (fs.existsSync(binPath)) {
            const files = fs.readdirSync(binPath);
            files.forEach(file => {
                if (file.startsWith('neutralino-')) {
                    const newName = file.replace('neutralino-', 'suman-');
                    fs.renameSync(path.join(binPath, file), path.join(binPath, newName));
                }
            });
        }

        // Minimal main.js
        const mainJsPath = path.join(projectPath, 'resources', 'js', 'main.js');
        if (fs.existsSync(mainJsPath)) {
            const minimalMainJs = `
// Initialize Sumjs
Sumjs.init();

// Register event listeners
Sumjs.events.on("windowClose", () => {
    Sumjs.app.exit();
});
`;
            fs.writeFileSync(mainJsPath, minimalMainJs.trim());
        }

        // API Rebranding
        // 1. Patch sum.js to expose Sumjs global
        const sumJsPath = path.join(projectPath, 'resources', 'js', 'sum.js');
        if (fs.existsSync(sumJsPath)) {
            fs.appendFileSync(sumJsPath, '\nwindow.Sumjs = window.Neutralino;');
        }

        // 2. Rename and patch type definitions
        const dtsPath = path.join(projectPath, 'resources', 'js', 'neutralino.d.ts');
        const newDtsPath = path.join(projectPath, 'resources', 'js', 'sum.d.ts');
        if (fs.existsSync(dtsPath)) {
            let dtsContent = fs.readFileSync(dtsPath, 'utf8');
            dtsContent = dtsContent.replace('export as namespace Neutralino;', 'export as namespace Sumjs;');
            dtsContent = dtsContent.replace('const Neutralino: any;', 'const Sumjs: any;');
            fs.writeFileSync(newDtsPath, dtsContent);
            fs.unlinkSync(dtsPath);
        }

        // Clear styles.css
        const stylesCssPath = path.join(projectPath, 'resources', 'styles.css');
        if (fs.existsSync(stylesCssPath)) {
            fs.writeFileSync(stylesCssPath, '');
        }

    } catch (e) {
        logger.error('Failed to configure project: ' + e.message);
    }

    // 4. Install dependencies
    logger.info('Installing dependencies...');
    const installSpinner = ora('Installing sumjs dependencies...').start();
    shell.cd('react-src');
    if (shell.exec('npm install', { silent: true }).code !== 0) {
        installSpinner.fail('Failed to install dependencies.');
    } else {
        installSpinner.succeed('All dependencies installed!');
    }

    // 5. Final instructions
    console.log('');
    logger.success(`sumjs app ${projectName} is ready! 🚀`);
    console.log('');
    logger.info('To get started:');
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  sumjs run'));
    console.log('');
};

module.exports = create;
