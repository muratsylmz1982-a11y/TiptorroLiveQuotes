// modules/config.js
const fs = require('fs');
const { promises: fsPromises } = fs;
const utils = require('./utils'); // Das neue Utility-Modul einbinden
const logger = require('./logger');
function loadConfig(app) {
  const configPath = utils.getUserDataPath(app, 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(data);
      return Array.isArray(config) ? config : [];
    }
  } catch (err) {
  logger.logError('Fehler beim Laden der Konfiguration', err);
  // Versuche Backup-Wiederherstellung
  try {
    const backupPath = configPath.replace('.json', '_backup.json');
    if (fs.existsSync(backupPath)) {
      const backupData = fs.readFileSync(backupPath, 'utf-8');
      const backupConfig = JSON.parse(backupData);
      logger.logWarning('Konfiguration aus Backup wiederhergestellt');
      return Array.isArray(backupConfig) ? backupConfig : [];
    }
  } catch (backupErr) {
    logger.logError('Backup-Wiederherstellung fehlgeschlagen', backupErr);
  }
}
  return [];
}
// Async Version für bessere Performance
async function loadConfigAsync(app) {
    const configPath = utils.getUserDataPath(app, 'config.json');
    try {
        if (fs.existsSync(configPath)) {
            const data = await fsPromises.readFile(configPath, 'utf-8');
            const config = JSON.parse(data);
            logger.logInfo('[CONFIG] Async Config geladen:', config.length, 'Einträge');
            return Array.isArray(config) ? config : [];
        }
        return [];
    } catch (err) {
        logger.logWarning('Fehler beim async Laden der Konfiguration:', err);
        return [];
    }
}
// Async Version für bessere Performance
async function saveConfigAsync(app, data) {
    const configPath = utils.getUserDataPath(app, 'config.json');
    try {
        await fsPromises.writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8');
        logger.logSuccess('[CONFIG] Async Config gespeichert:', data.length, 'Einträge');
        return true;
    } catch (err) {
        logger.logError('Fehler beim async Speichern der Konfiguration:', err);
        return false;
    }
}
function saveConfig(app, data) {
  const configPath = utils.getUserDataPath(app, 'config.json');
  const backupPath = configPath.replace('.json', '_backup.json');
  
  // Validation vor dem Speichern
  const validatedData = validateConfig(data);
  
  try {
    // Backup der aktuellen Konfiguration erstellen
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
    }
    
    fs.writeFileSync(configPath, JSON.stringify(validatedData, null, 2), 'utf-8');
    logger.logSuccess(`Konfiguration gespeichert: ${validatedData.length} Einträge`);
    return true;
  } catch (err) {
    logger.logError('Fehler beim Speichern der Konfiguration', err);
    
    // Versuche Backup wiederherzustellen
    try {
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, configPath);
        logger.logWarning('Konfiguration aus Backup wiederhergestellt');
      }
    } catch (restoreErr) {
      logger.logError('Backup-Wiederherstellung fehlgeschlagen', restoreErr);
    }
    return false;
  }
}

function migrateConfigFormat(oldConfig, displays) {
  return oldConfig.map(cfg => {
    if (cfg.monitorId !== undefined && cfg.url) {
      const index = displays.findIndex(d => d.id === cfg.monitorId);
      if (index !== -1) return { monitorIndex: index, url: cfg.url };
    }
    return cfg;
  });
}

function deleteConfig(app) {
  const utils = require('./utils');
  const configPath = utils.getUserDataPath(app, 'config.json');
  const fs = require('fs');
  if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
}
// Validiert eine Konfiguration
function validateConfig(config) {
    if (!Array.isArray(config)) {
        logger.logWarning('[CONFIG] Konfiguration ist kein Array');
        return [];
    }
    
    const validConfigs = [];
    
    config.forEach((item, index) => {
        // Prüfe erforderliche Felder
        if (typeof item.monitorIndex !== 'number') {
            logger.logWarning(`[CONFIG] Ungültiger monitorIndex bei Index ${index}:`, item.monitorIndex);
            return;
        }
        
        if (!item.url || typeof item.url !== 'string') {
            logger.logWarning(`[CONFIG] Ungültige URL bei Index ${index}:`, item.url);
            return;
        }
        
        // URL-Format prüfen
        try {
            new URL(item.url);
        } catch (error) {
            logger.logWarning(`[CONFIG] Malformierte URL bei Index ${index}:`, item.url);
            return;
        }
        
        // Sichere URLs prüfen
        const allowedProtocols = ['https:', 'http:'];
        const urlObj = new URL(item.url);
        
        if (!allowedProtocols.includes(urlObj.protocol)) {
            logger.logWarning(`[CONFIG] Unsicheres Protokoll bei Index ${index}:`, urlObj.protocol);
            return;
        }
        
        validConfigs.push(item);
    });
    
    logger.logInfo(`[CONFIG] Validation: ${config.length} → ${validConfigs.length} gültige Einträge`);
    return validConfigs;
}
module.exports = {
    loadConfig,
    saveConfig,
    loadConfigAsync,
    saveConfigAsync,
    migrateConfigFormat,
    deleteConfig,
    validateConfig
};
