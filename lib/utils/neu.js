const path = require('path');
const fs = require('fs');

const getNeuPath = () => {
    // Resolve path relative to this file (lib/utils/neu.js)
    // Root is ../../
    const rootDir = path.resolve(__dirname, '../../');
    const nodeModulesBin = path.join(rootDir, 'node_modules', '.bin');
    
    let neuPath = path.join(nodeModulesBin, 'neu');
    
    if (process.platform === 'win32') {
        neuPath += '.cmd';
    }

    // Fallback: If not found in local node_modules (e.g. during dev), try global or npx
    if (!fs.existsSync(neuPath)) {
        // Try to resolve from @neutralinojs/neu package
        try {
            const pkgPath = require.resolve('@neutralinojs/neu/package.json');
            const pkgDir = path.dirname(pkgPath);
            const pkg = require(pkgPath);
            if (pkg.bin && pkg.bin.neu) {
                return path.join(pkgDir, pkg.bin.neu);
            }
        } catch (e) {
            // Ignore
        }
        
        // If all else fails, return 'neu' and hope it's in PATH
        return 'neu';
    }

    return neuPath;
};

module.exports = getNeuPath;
