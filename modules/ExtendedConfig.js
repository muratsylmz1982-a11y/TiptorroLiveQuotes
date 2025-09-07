// modules/ExtendedConfig.js
const fs = require('fs');
const utils = require('./utils');

class ExtendedConfig {
    constructor(app) {
        this.app = app;
        this.configPath = utils.getUserDataPath(app, 'extended-config.json');
        this.defaultConfig = {
            refresh: {
                intervalMs: 1800000,        // 30 Minuten
                overlayMinTimeMs: 3500,     // 3,5 Sekunden
                retryDelayMs: 1000,         // 1 Sekunde
                enabled: true
            },
            performance: {
                enableMonitoring: true,
                enableAnalytics: true,
                autoCleanup: true,
                maxMemoryMB: 300
            },
            security: {
                enforceHttps: false,
                allowedDomains: [
                    'docs.google.com',
                    'shop.tiptorro.com'
                ],
                blockUnknownDomains: false
            },
            ui: {
                theme: 'dark',
                showNotifications: true,
                enableTooltips: true,
                compactMode: false
            },
            updates: {
                autoCheck: true,
                checkIntervalHours: 24,
                allowPrerelease: false
            },
            logging: {
                level: 'info',              // debug, info, warn, error
                maxLogFiles: 5,
                maxLogSizeMB: 5
            }
        };
    }
    
    // Lädt erweiterte Konfiguration
    async loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = await fs.promises.readFile(this.configPath, 'utf-8');
                const config = JSON.parse(data);
                
                // Merge mit Default-Config für fehlende Werte
                return this.mergeWithDefaults(config);
            }
            
            // Erstelle Default-Config beim ersten Start
            await this.saveConfig(this.defaultConfig);
            return this.defaultConfig;
            
        } catch (error) {
  const logger = require('./logger');
  logger.logError('[EXTENDED-CONFIG] Fehler beim Laden', error);
  // Versuche Backup wiederherzustellen
  try {
    const backupPath = this.configPath.replace('.json', '_backup.json');
    if (require('fs').existsSync(backupPath)) {
      const backupData = await require('fs').promises.readFile(backupPath, 'utf-8');
      const backupConfig = JSON.parse(backupData);
      logger.logWarning('Extended-Config aus Backup wiederhergestellt');
      return this.mergeWithDefaults(backupConfig);
    }
  } catch (backupErr) {
    logger.logError('[EXTENDED-CONFIG] Backup-Wiederherstellung fehlgeschlagen', backupErr);
  }
  return this.defaultConfig;
}
    }
    
    // Speichert erweiterte Konfiguration
    async saveConfig(config) {
  try {
    // Backup erstellen
    const backupPath = this.configPath.replace('.json', '_backup.json');
    if (fs.existsSync(this.configPath)) {
      await fs.promises.copyFile(this.configPath, backupPath);
    }
    
    const validatedConfig = this.validateConfig(config);
    await fs.promises.writeFile(this.configPath, JSON.stringify(validatedConfig, null, 2));
    
    const logger = require('./logger');
    logger.logSuccess('Extended-Config gespeichert');
    return true;
  } catch (error) {
    const logger = require('./logger');
    logger.logError('[EXTENDED-CONFIG] Fehler beim Speichern', error);
    
    // Backup wiederherstellen
    try {
      const backupPath = this.configPath.replace('.json', '_backup.json');
      if (fs.existsSync(backupPath)) {
        await fs.promises.copyFile(backupPath, this.configPath);
        logger.logWarning('Extended-Config aus Backup wiederhergestellt');
      }
    } catch (restoreErr) {
      logger.logError('[EXTENDED-CONFIG] Backup-Wiederherstellung fehlgeschlagen', restoreErr);
    }
    return false;
  }
}
    
    // Merged Konfiguration mit Defaults
    mergeWithDefaults(config) {
        const merged = { ...this.defaultConfig };
        
        Object.keys(config).forEach(section => {
            if (merged[section] && typeof merged[section] === 'object') {
                merged[section] = { ...merged[section], ...config[section] };
            } else {
                merged[section] = config[section];
            }
        });
        
        return merged;
    }
    
    // Validiert Konfiguration
    validateConfig(config) {
        const validated = { ...config };
        
        // Refresh-Validierung
        if (validated.refresh) {
            validated.refresh.intervalMs = Math.max(30000, validated.refresh.intervalMs || 60000);
            validated.refresh.overlayMinTimeMs = Math.max(1000, validated.refresh.overlayMinTimeMs || 3000);
            validated.refresh.retryDelayMs = Math.max(500, validated.refresh.retryDelayMs || 1000);
        }
        
        // Performance-Validierung
        if (validated.performance) {
            validated.performance.maxMemoryMB = Math.max(100, Math.min(1000, validated.performance.maxMemoryMB || 300));
        }
        
        // Security-Validierung
        if (validated.security && validated.security.allowedDomains) {
            validated.security.allowedDomains = validated.security.allowedDomains.filter(domain => 
                typeof domain === 'string' && domain.length > 0
            );
        }
        
        // Updates-Validierung
        if (validated.updates) {
            validated.updates.checkIntervalHours = Math.max(1, Math.min(168, validated.updates.checkIntervalHours || 24));
        }
        
        console.log('[EXTENDED-CONFIG] Konfiguration validiert');
        return validated;
    }
    
    // Gibt spezifische Sektion zurück
    async getSection(sectionName) {
        const config = await this.loadConfig();
        return config[sectionName] || {};
    }
    
    // Aktualisiert spezifische Sektion
    async updateSection(sectionName, sectionData) {
        const config = await this.loadConfig();
        config[sectionName] = { ...config[sectionName], ...sectionData };
        return await this.saveConfig(config);
    }
    
    // Reset auf Defaults
    async resetToDefaults() {
        return await this.saveConfig(this.defaultConfig);
    }
}

module.exports = ExtendedConfig;