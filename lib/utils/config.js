const fs = require('fs');
const path = require('path');

const getConfig = () => {
    const configPath = path.join(process.cwd(), 'sum.config.json');
    if (fs.existsSync(configPath)) {
        try {
            return require(configPath);
        } catch (e) {
            return null;
        }
    }
    return null;
};

module.exports = {
    getConfig,
};
