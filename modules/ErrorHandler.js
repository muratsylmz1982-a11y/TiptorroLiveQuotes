// modules/ErrorHandler.js
const { app, dialog } = require('electron');
const logger = require('./logger');
const path = require('path');

/**
 * Globaler Error Handler für die Electron App
 * Fängt alle unerwarteten Fehler ab und verhindert Abstürze
 */
class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrorsBeforeRestart = 10;
        this.errorLog = [];
        // Erhöhe MaxListeners um EventEmitter-Warnungen zu vermeiden
        if (process.setMaxListeners) {
            process.setMaxListeners(15);
        }
        this.setupHandlers();
        logger.logSuccess('[ERROR-HANDLER] Initialisiert');
    }

    /**
     * Richtet alle Error Handler ein
     */
    setupHandlers() {
        // Uncaught Exceptions im Main Process
        process.on('uncaughtException', (error, origin) => {
            this.handleUncaughtException(error, origin);
        });

        // Unhandled Promise Rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handleUnhandledRejection(reason, promise);
        });

        // Renderer Process Crashes
        app.on('render-process-gone', (event, webContents, details) => {
            this.handleRendererCrash(event, webContents, details);
        });

        // Child Process Errors
        app.on('child-process-gone', (event, details) => {
            this.handleChildProcessGone(event, details);
        });

        // GPU Process Crash
        app.on('gpu-process-crashed', (event, killed) => {
            this.handleGPUCrash(event, killed);
        });

        // Web Contents Crashed (Legacy Support)
        app.on('web-contents-created', (event, webContents) => {
            webContents.on('crashed', (event, killed) => {
                this.handleWebContentsCrash(webContents, killed);
            });

            // Unresponsive Detection
            webContents.on('unresponsive', () => {
                this.handleUnresponsive(webContents);
            });

            webContents.on('responsive', () => {
                logger.logSuccess('[ERROR-HANDLER] WebContents wieder responsive', {
                    id: webContents.id
                });
            });
        });

        // Before Quit - Final Cleanup
        app.on('before-quit', () => {
            this.generateErrorReport();
        });

        logger.logInfo('[ERROR-HANDLER] Alle Handler registriert');
    }

    /**
     * Behandelt uncaught exceptions
     */
    handleUncaughtException(error, origin) {
        this.errorCount++;
        
        const errorInfo = {
            type: 'uncaughtException',
            message: error.message,
            stack: error.stack,
            origin: origin,
            timestamp: new Date().toISOString(),
            errorCount: this.errorCount
        };

        this.errorLog.push(errorInfo);

        logger.logError('[ERROR-HANDLER] Uncaught Exception', {
            message: error.message,
            origin: origin,
            stack: error.stack,
            errorCount: this.errorCount
        });

        // Bei zu vielen Fehlern: App neustarten
        if (this.errorCount >= this.maxErrorsBeforeRestart) {
            this.showCriticalErrorDialog(
                'Zu viele Fehler aufgetreten',
                `Die Anwendung hatte ${this.errorCount} Fehler und wird neu gestartet.`
            );
            this.restartApp();
        } else {
            // Bei nicht-kritischen Fehlern: Weiter laufen lassen
            logger.logWarning('[ERROR-HANDLER] App läuft weiter trotz Fehler');
        }
    }

    /**
     * Behandelt unhandled promise rejections
     */
    handleUnhandledRejection(reason, promise) {
        this.errorCount++;

        const errorInfo = {
            type: 'unhandledRejection',
            reason: reason?.toString() || 'Unknown reason',
            stack: reason?.stack || 'No stack trace',
            timestamp: new Date().toISOString(),
            errorCount: this.errorCount
        };

        this.errorLog.push(errorInfo);

        logger.logError('[ERROR-HANDLER] Unhandled Promise Rejection', {
            reason: errorInfo.reason,
            stack: errorInfo.stack,
            errorCount: this.errorCount
        });
    }

    /**
     * Behandelt Renderer Process Crashes
     */
    handleRendererCrash(event, webContents, details) {
        logger.logError('[ERROR-HANDLER] Renderer Process Crashed', {
            reason: details.reason,
            exitCode: details.exitCode,
            webContentsId: webContents.id
        });

        // Versuche den Renderer neu zu laden
        if (!webContents.isDestroyed()) {
            setTimeout(() => {
                try {
                    webContents.reload();
                    logger.logSuccess('[ERROR-HANDLER] Renderer neu geladen');
                } catch (error) {
                    logger.logError('[ERROR-HANDLER] Konnte Renderer nicht neu laden', error);
                }
            }, 1000);
        }
    }

    /**
     * Behandelt Child Process Crashes
     */
    handleChildProcessGone(event, details) {
        logger.logError('[ERROR-HANDLER] Child Process Gone', {
            type: details.type,
            reason: details.reason,
            exitCode: details.exitCode,
            serviceName: details.serviceName,
            name: details.name
        });
    }

    /**
     * Behandelt GPU Process Crashes
     */
    handleGPUCrash(event, killed) {
        logger.logError('[ERROR-HANDLER] GPU Process Crashed', {
            killed: killed
        });

        this.showWarningDialog(
            'Grafikkarten-Fehler',
            'Es gab ein Problem mit der Grafikkarte. Die App versucht fortzufahren.'
        );
    }

    /**
     * Behandelt Web Contents Crashes (Legacy)
     */
    handleWebContentsCrash(webContents, killed) {
        logger.logError('[ERROR-HANDLER] Web Contents Crashed', {
            killed: killed,
            webContentsId: webContents.id
        });
    }

    /**
     * Behandelt unresponsive WebContents
     */
    handleUnresponsive(webContents) {
        logger.logWarning('[ERROR-HANDLER] WebContents unresponsive', {
            id: webContents.id,
            url: webContents.getURL()
        });

        // Optional: Nach 30 Sekunden neu laden
        setTimeout(() => {
            if (!webContents.isDestroyed()) {
                webContents.reload();
                logger.logInfo('[ERROR-HANDLER] Unresponsive WebContents neu geladen');
            }
        }, 30000);
    }

    /**
     * Zeigt kritischen Fehler-Dialog
     */
    showCriticalErrorDialog(title, message) {
        try {
            dialog.showErrorBox(title, message);
        } catch (error) {
            logger.logError('[ERROR-HANDLER] Konnte Dialog nicht anzeigen', error);
        }
    }

    /**
     * Zeigt Warnungs-Dialog (nicht-blockierend)
     */
    showWarningDialog(title, message) {
        try {
            dialog.showMessageBox({
                type: 'warning',
                title: title,
                message: message,
                buttons: ['OK']
            });
        } catch (error) {
            logger.logError('[ERROR-HANDLER] Konnte Dialog nicht anzeigen', error);
        }
    }

    /**
     * Startet die App neu
     */
    restartApp() {
        logger.logWarning('[ERROR-HANDLER] App wird neu gestartet...');
        
        setTimeout(() => {
            app.relaunch();
            app.exit(0);
        }, 2000);
    }

    /**
     * Generiert Fehler-Report
     */
    generateErrorReport() {
        if (this.errorLog.length > 0) {
            logger.logInfo('[ERROR-HANDLER] Fehler-Report', {
                totalErrors: this.errorLog.length,
                errors: this.errorLog.slice(-10) // Nur letzte 10 Fehler
            });
        }
    }

    /**
     * Gibt Fehler-Statistiken zurück
     */
    getStats() {
        const errorTypes = {};
        this.errorLog.forEach(error => {
            errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
        });

        return {
            totalErrors: this.errorLog.length,
            errorTypes: errorTypes,
            recentErrors: this.errorLog.slice(-5)
        };
    }

    /**
     * Setzt Fehler-Counter zurück
     */
    resetErrorCount() {
        const previousCount = this.errorCount;
        this.errorCount = 0;
        logger.logInfo('[ERROR-HANDLER] Error count zurückgesetzt', {
            previousCount: previousCount
        });
    }

    /**
     * Gibt Error Log zurück
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Löscht Error Log
     */
    clearErrorLog() {
        const previousLength = this.errorLog.length;
        this.errorLog = [];
        logger.logInfo('[ERROR-HANDLER] Error Log gelöscht', {
            deletedEntries: previousLength
        });
    }
}

// Singleton Instance
let errorHandlerInstance = null;

module.exports = {
    /**
     * Initialisiert den Error Handler (nur einmal)
     */
    init: () => {
        if (!errorHandlerInstance) {
            errorHandlerInstance = new ErrorHandler();
        }
        return errorHandlerInstance;
    },

    /**
     * Gibt die Error Handler Instance zurück
     */
    getInstance: () => {
        if (!errorHandlerInstance) {
            throw new Error('ErrorHandler not initialized. Call init() first.');
        }
        return errorHandlerInstance;
    }
};

