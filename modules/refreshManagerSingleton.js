// modules/refreshManagerSingleton.js
const ExtendedConfig = require('./ExtendedConfig');
const RefreshManager = require('./RefreshManager');

let instance = null;

function getRefreshManager(app) {
    if (!instance) {
        const extendedConfig = new ExtendedConfig(app);
        instance = new RefreshManager(extendedConfig);

        // Konfig laden, ohne main zu blockieren
        (async () => {
            await instance.loadConfig();
        })();
    }
    return instance;
}

module.exports = { getRefreshManager };