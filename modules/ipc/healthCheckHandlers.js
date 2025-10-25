// modules/ipc/healthCheckHandlers.js
const { ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const logger = require('../logger');

let healthCheckWindow = null;

/**
 * Öffnet das Health Check Dashboard
 */
function openHealthCheckDashboard(healthCheck) {
    if (healthCheckWindow) {
        healthCheckWindow.focus();
        return healthCheckWindow;
    }
    
    healthCheckWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'TTQuotes Health Check Dashboard',
        icon: path.join(__dirname, '..', '..', 'tttray.png'),
        alwaysOnTop: true,  // Always on top, even above Live-Views
        frame: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '..', '..', 'preload.js'),
            enableRemoteModule: false
        }
    });
    
    healthCheckWindow.loadFile(path.join(__dirname, '..', '..', 'health-check-dashboard.html'));
    
    healthCheckWindow.on('closed', () => {
        healthCheckWindow = null;
        // Stop monitoring wenn Dashboard geschlossen wird
        try {
            healthCheck.stopMonitoring();
        } catch (e) {
            // Ignore
        }
    });
    
    logger.logSuccess('Health Check Dashboard geöffnet');
    return healthCheckWindow;
}

/**
 * Registriert alle IPC Handlers für Health Check und Error Handler
 */
function registerHealthCheckHandlers(healthCheck, errorHandler) {
    // Open Health Check Dashboard
    ipcMain.handle('open-health-check-dashboard', () => {
        try {
            return openHealthCheckDashboard(healthCheck) !== null;
        } catch (error) {
            logger.logError('[IPC] open-health-check-dashboard failed', error);
            return false;
        }
    });
    // Health Check Handlers
    ipcMain.handle('health-check:get-status', async () => {
        try {
            return await healthCheck.performHealthCheck();
        } catch (error) {
            logger.logError('[IPC] health-check:get-status failed', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('health-check:get-current', () => {
        try {
            return healthCheck.getHealth();
        } catch (error) {
            logger.logError('[IPC] health-check:get-current failed', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('health-check:get-system-info', () => {
        try {
            return healthCheck.getSystemInfo();
        } catch (error) {
            logger.logError('[IPC] health-check:get-system-info failed', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('health-check:start-monitoring', (event, intervalMs) => {
        try {
            healthCheck.startMonitoring(intervalMs || 5000);
            logger.logSuccess('[IPC] Health Check Monitoring gestartet', { intervalMs: intervalMs || 5000 });
            return { success: true };
        } catch (error) {
            logger.logError('[IPC] health-check:start-monitoring failed', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('health-check:stop-monitoring', () => {
        try {
            healthCheck.stopMonitoring();
            logger.logSuccess('[IPC] Health Check Monitoring gestoppt');
            return { success: true };
        } catch (error) {
            logger.logError('[IPC] health-check:stop-monitoring failed', error);
            return { success: false, error: error.message };
        }
    });

    // Error Handler Handlers
    ipcMain.handle('error-handler:get-stats', () => {
        try {
            return errorHandler.getInstance().getStats();
        } catch (error) {
            logger.logError('[IPC] error-handler:get-stats failed', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('error-handler:get-log', () => {
        try {
            return errorHandler.getInstance().getErrorLog();
        } catch (error) {
            logger.logError('[IPC] error-handler:get-log failed', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('error-handler:clear-log', () => {
        try {
            errorHandler.getInstance().clearErrorLog();
            logger.logSuccess('[IPC] Error Log gelöscht');
            return { success: true };
        } catch (error) {
            logger.logError('[IPC] error-handler:clear-log failed', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('error-handler:reset-count', () => {
        try {
            errorHandler.getInstance().resetErrorCount();
            logger.logSuccess('[IPC] Error Count zurückgesetzt');
            return { success: true };
        } catch (error) {
            logger.logError('[IPC] error-handler:reset-count failed', error);
            return { success: false, error: error.message };
        }
    });

    logger.logSuccess('[IPC] Health Check & Error Handler IPC Handlers registriert');
}

module.exports = { 
    registerHealthCheckHandlers,
    openHealthCheckDashboard 
};

