const shell = require('shelljs');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const ora = require('ora');

const build = async () => {
    logger.info('Building sumjs project...');

    const reactSrcPath = path.join(process.cwd(), 'react-src');
    if (!fs.existsSync(reactSrcPath)) {
        logger.error('react-src directory not found!');
        process.exit(1);
    }

    // Build React App
    const spinner = ora('Building React application...').start();
    if (shell.exec('cd react-src && npm run build').code !== 0) {
        spinner.fail('React build failed!');
        process.exit(1);
    }
    spinner.succeed('React application built!');

    // Move assets
    logger.info('Moving assets to resources...');
    const buildDir = path.join(reactSrcPath, 'dist'); // Assuming Vite
    const resourcesDir = path.join(process.cwd(), 'resources');

    // Clear resources (except neutralino.js/config if needed, but usually we overwrite)
    // For safety, let's just copy contents
    shell.cp('-R', path.join(buildDir, '*'), resourcesDir);

    // Build sumjs binary
    logger.info('Building sumjs binary...');

    // Workaround: neu CLI requires neutralino.config.json
    const sumConfigPath = path.join(process.cwd(), 'sum.config.json');
    const neuConfigPath = path.join(process.cwd(), 'neutralino.config.json');
    let renamedConfig = false;

    if (fs.existsSync(sumConfigPath)) {
        fs.renameSync(sumConfigPath, neuConfigPath);
        renamedConfig = true;
    }

    // Workaround: Rename binaries back to neutralino-* for build
    const binPath = path.join(process.cwd(), 'bin');
    let renamedBinaries = false;
    if (fs.existsSync(binPath)) {
        const files = fs.readdirSync(binPath);
        files.forEach(file => {
            if (file.startsWith('suman-')) {
                const newName = file.replace('suman-', 'neutralino-');
                fs.renameSync(path.join(binPath, file), path.join(binPath, newName));
                renamedBinaries = true;
            }
        });
    }

    try {
        const getNeuPath = require('../utils/neu');
        const neu = getNeuPath();
        if (shell.exec(`"${neu}" build`).code !== 0) {
            logger.error('Build failed!');
            process.exit(1);
        }
    } finally {
        // Restore config
        if (renamedConfig && fs.existsSync(neuConfigPath)) {
            fs.renameSync(neuConfigPath, sumConfigPath);
        }

        // Restore binaries
        if (renamedBinaries && fs.existsSync(binPath)) {
            const files = fs.readdirSync(binPath);
            files.forEach(file => {
                if (file.startsWith('neutralino-')) {
                    const newName = file.replace('neutralino-', 'suman-');
                    fs.renameSync(path.join(binPath, file), path.join(binPath, newName));
                }
            });
        }
    }

    logger.success('Build completed successfully!');
};

module.exports = build;
