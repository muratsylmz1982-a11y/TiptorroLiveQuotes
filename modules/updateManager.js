// modules/updateManager.js
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const EventEmitter = require('events');
const logger = require('./logger');

class UpdateManager extends EventEmitter {
     constructor(mainWindow) {
     super();                          // ← EventEmitter initialisieren
     this.mainWindow = mainWindow;
     this.isSimulationMode = process.env.NODE_ENV !== 'production';
     this.lastUpdateCheck = null;
     this.simulatedScenarios = [ ];
    this.setupAutoUpdater();
     }

// Simuliert Update-Checking für Testzwecke
simulateUpdateCheck() {
    console.log('[UPDATE] Simuliere Update-Prüfung...');
    
    // Simuliere verschiedene Update-Szenarien
    const scenarios = [
        { hasUpdate: false },
        { hasUpdate: true, version: '1.2.0', critical: false },
        { hasUpdate: true, version: '1.1.1', critical: true }
    ];
    
    // Zufälliges Szenario für Demo
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    setTimeout(() => {
        if (scenario.hasUpdate) {
            this.emit('update-available', {
                version: scenario.version,
                releaseDate: new Date().toISOString(),
                critical: scenario.critical,
                releaseNotes: scenario.critical 
                    ? 'Kritisches Sicherheitsupdate - sofortige Installation empfohlen'
                    : 'Neue Features und Verbesserungen verfügbar'
            });
        } else {
            this.emit('update-not-available', {
                currentVersion: '1.1.0'
            });
        }
    }, 2000); // 2 Sekunden Delay für Realismus
}
    setupAutoUpdater() {
        logger.logSuccess('Auto-Updater initialisiert');

        // Auto-Update konfigurieren (für lokale Tests deaktiviert)
// Für Produktion: GitHub Repository erstellen und diese Zeilen aktivieren
/*
autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'IhrGithubName', // Ersetzen mit Ihrem GitHub Username
    repo: 'ttquotes',       // Ersetzen mit Repository-Name
    private: false
});
*/

// Für Development/Testing: Simuliere Updates
this.simulateUpdates = true;

        // Update verfügbar
        autoUpdater.on('update-available', (info) => {
            logger.logSuccess(`Update verfügbar: Version ${info.version}`);
            this.notifyUpdateAvailable(info);
        });

        // Update heruntergeladen
        autoUpdater.on('update-downloaded', (info) => {
            logger.logSuccess(`Update heruntergeladen: Version ${info.version}`);
            this.notifyUpdateReady(info);
        });

        // Kein Update verfügbar
        autoUpdater.on('update-not-available', (info) => {
            logger.logDebug('Keine Updates verfügbar', info);
        });

        // Update-Fehler
        autoUpdater.on('error', (error) => {
            logger.logError('Auto-Updater Fehler', error);
        });

        // Download-Progress
        autoUpdater.on('download-progress', (progressObj) => {
            const percent = Math.round(progressObj.percent);
            logger.logDebug(`Download-Progress: ${percent}%`);
            
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send('download-progress', percent);
            }
        });
    }

    async checkForUpdates() {
    try {
        logger.logDebug('Prüfe auf Updates...');
        
        if (this.simulateUpdates) {
            this.simulateUpdateCheck();
        } else {
            // Für echte Updates:
            await autoUpdater.checkForUpdatesAndNotify();
        }
        
        return true;
    } catch (error) {
        logger.logError('Fehler bei Update-Prüfung', error);
        return false;
    }
}

    // Benachrichtigung: Update verfügbar
    notifyUpdateAvailable(info) {
        const response = dialog.showMessageBoxSync(this.mainWindow, {
            type: 'info',
            title: 'Update verfügbar',
            message: `Eine neue Version (${info.version}) ist verfügbar!`,
            detail: 'Möchten Sie das Update jetzt herunterladen?',
            buttons: ['Ja, herunterladen', 'Später'],
            defaultId: 0
        });

        if (response === 0) {
            logger.logDebug('Benutzer hat Update-Download gestartet');
            // autoUpdater.downloadUpdate(); // Für echte Updates
        } else {
            logger.logDebug('Benutzer hat Update verschoben');
        }
    }

    // Benachrichtigung: Update bereit zur Installation
    notifyUpdateReady(info) {
        const response = dialog.showMessageBoxSync(this.mainWindow, {
            type: 'info',
            title: 'Update bereit',
            message: `Version ${info.version} wurde heruntergeladen!`,
            detail: 'Die Anwendung wird neu gestartet, um das Update zu installieren.',
            buttons: ['Jetzt neu starten', 'Beim nächsten Start'],
            defaultId: 0
        });

        if (response === 0) {
            logger.logSuccess('Starte Update-Installation...');
            autoUpdater.quitAndInstall();
        } else {
            logger.logDebug('Update wird beim nächsten Start installiert');
        }
    }

    // Manuelle Update-Prüfung durch Benutzer
    async checkManually() {
        logger.logDebug('Manuelle Update-Prüfung gestartet');
        
        const result = await this.checkForUpdates();
        
        if (result) {
            dialog.showMessageBoxSync(this.mainWindow, {
                type: 'info',
                title: 'Updates',
                message: 'Update-Prüfung abgeschlossen',
                detail: 'Schauen Sie in die Logs für Details.'
            });
        }
    }
}

module.exports = UpdateManager;
