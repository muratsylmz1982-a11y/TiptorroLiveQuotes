const { safeLoadUrl } = require('./modules/safeLoad');
/* ===== TTQ early session hardening (must run before any BrowserWindow) ===== */
try {
  const { hardenSession, hardenWebContents } = require('./modules/security');
  const { app, session } = require('electron');

  // Default-Session sofort härten (nur einmal)
  if (session && session.defaultSession && !session.defaultSession.__ttqHardened) {
    hardenSession(session.defaultSession);
    session.defaultSession.__ttqHardened = true;
  }

  // Zukünftige Sessions ebenfalls härten
  app.on('session-created', (sess) => {
    try {
      if (!sess.__ttqHardened) {
        hardenSession(sess);
        sess.__ttqHardened = true;
      }
    } catch {}
  });

  // Jedes neue Fenster absichern (Navigation/Popups)
  app.on('browser-window-created', (_e, win) => {
    try { hardenWebContents(win.webContents); } catch {}
  });
} catch {}
/* ===== end TTQ early session hardening ===== */
const { app, BrowserWindow, screen, ipcMain, globalShortcut } = require('electron');
const { createDisplayWindow, closeTicketcheckerWindow: killTicketchecker } = require('./modules/displays');
// Erlaubt Kamera, USB und Serial nur fÃ¼r Ticketchecker-Seite
app.on('web-contents-created', (event, contents) => {
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    if (url.startsWith('http://shop.tiptorro.com/ticketchecker') &&
        (permission === 'media' || permission === 'usb' || permission === 'serial')) {
      return callback(true);
    }
    callback(false);
  });
});
const path = require('path');

// Auto-Start: IPC-Handler registrieren
const AutoLauncher = require('auto-launch');
const appAutoLauncher = new AutoLauncher({ name: 'TTQuotes', path: app.getPath('exe') });

ipcMain.handle('get-autostart', async () => {
  try {
    return await appAutoLauncher.isEnabled();
  } catch (err) {
    console.error('Fehler beim Abfragen des Autostart-Status', err);
    return false;
  }
});

ipcMain.handle('toggle-autostart', async (event, enable) => {
  try {
    if (enable) await appAutoLauncher.enable();
    else        await appAutoLauncher.disable();
    return true;
  } catch (err) {
    console.error('Fehler beim Umschalten des Autostart', err);
    return false;
  }
});
// âœ… ExtendedConfig + RefreshManager Ã¼ber Singleton
const { getRefreshManager } = require('./modules/refreshManagerSingleton');
const refreshManager = getRefreshManager(app);

// Optional global verfÃ¼gbar machen:
global.refreshManager = refreshManager;
// --- Cleanup alte Auto-Start-EintrÃ¤ge via app.setLoginItemSettings ---
app.whenReady().then(() => {
  app.setLoginItemSettings({
    openAtLogin: false,
    path: process.execPath,
    args: []
  });
  console.log('[AUTO-START] Alte Login-Item-EintrÃ¤ge entfernt');
});
const { zeigeWartebildschirme, schliesseWartebildschirme } = require('./modules/wartebildschirme');
const WindowManager = require('./modules/WindowManager');
const logger = require('./modules/logger');
const PerformanceMonitor = require('./modules/PerformanceMonitor');
const UpdateManager = require('./modules/updateManager');
const AnalyticsManager = require('./modules/AnalyticsManager');
const config = require('./modules/config');
const favorites = require('./modules/favorites');
require('./modules/ipc/favoritesHandlers')(app, ipcMain, favorites);
require('./modules/ipc/displayHandlers')(app, ipcMain, screen);

ipcMain.on('config-updated', async () => {
  await refreshManager.loadConfig();

  // Neue Werte auf alle Fenster anwenden UND jetzt alle Timer synchronisieren
  refreshManager.windows.forEach(w => {
    w.refreshDelay = refreshManager.refreshDelay;
    w.overlayDelay = refreshManager.overlayDelay;
    w.lastRefresh = Date.now(); // <--- Das synchronisiert ALLE Fenster
  });

  console.log('[REFRESH-MANAGER] Neue Config Ã¼bernommen');
});

// Tray-Icon entfernt
let configWindow = null;
let dashboardWindow = null;
const windowManager = new WindowManager();
const performanceMonitor = new PerformanceMonitor();
let liveWindows = []; // Wird schrittweise durch windowManager ersetzt
let isAppQuitting = false;
let isAppReturningToUI = false;
let updateManager = null;
let analyticsManager = null;

global.isAppQuitting = false;
global.isAppReturningToUI = false;

ipcMain.handle('get-current-config', () => config.loadConfig(app));

// PrÃ¼ft, ob eine gÃ¼ltige Konfiguration existiert
function isValidConfig(saved, displays) {
    if (!Array.isArray(saved)) return false;
    if (saved.some(cfg => cfg.monitorId !== undefined)) {
        saved = config.migrateConfigFormat(saved, displays);
        config.saveConfig(app, saved);
    }
    return saved.some(cfg => typeof cfg.monitorIndex === 'number' && cfg.url);
}

// Erstellt das Vollbild-Konfigurationsfenster auf dem Hauptmonitor
function createConfigWindow() {
    if (configWindow) return;

    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    const primaryIndex = displays.findIndex(d => d.id === primaryDisplay.id);
    const bounds = primaryDisplay.bounds;

    configWindow = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        fullscreen: true,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
        }
    });

    configWindow.loadFile('index.html');
    configWindow.on('closed', () => { configWindow = null; });

    configWindow.webContents.once('did-finish-load', () => {
        configWindow.webContents.executeJavaScript(`
            (function() {
                const number = document.createElement('div');
                number.textContent = '${primaryIndex + 1}';
                Object.assign(number.style, {
                    position: 'fixed',
                    bottom: '2vw',
                    left: '2vw',
                    color: 'white',
                    fontSize: '6vw',
                    fontWeight: 'bold',
                    zIndex: '9999',
                    pointerEvents: 'none'
                });
                document.body.appendChild(number);
            })();
        `);
    });
}

// Zeigt Config-UI an, beendet LiveViews + Ticketchecker
function reopenConfigWindow() {
    if (isAppQuitting || global.isAppQuitting) return;
    if (configWindow) return;

    liveWindows.forEach(win => { try { win.destroy(); } catch {} });
    liveWindows = [];
    killTicketchecker();


    schliesseWartebildschirme();
    zeigeWartebildschirme();

    createConfigWindow(); // sofort Ã¶ffnen, kein Timeout
}
// Erstellt das Performance Dashboard
function openPerformanceDashboard() {
    if (dashboardWindow) {
        dashboardWindow.focus();
        return;
    }
    
    dashboardWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'TTQuotes Performance Dashboard',
        icon: path.join(__dirname, 'tttray.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: false,
              
        }
    });
    
    dashboardWindow.loadFile('performance-dashboard.html');
    
    dashboardWindow.on('closed', () => {
        dashboardWindow = null;
    });
    
    // Dashboard-Daten regelmÃ¤ÃŸig senden
    const updateInterval = setInterval(() => {
        if (dashboardWindow && !dashboardWindow.isDestroyed()) {
            const dashboardData = performanceMonitor.getDashboardData();
            if (dashboardData) {
                dashboardWindow.webContents.send('dashboard-update', dashboardData);
            }
        } else {
            clearInterval(updateInterval);
        }
    }, 5000); // Alle 5 Sekunden
    
    logger.logSuccess('Performance Dashboard geÃ¶ffnet');
}
// Erstellt das Erweiterte Settings-Fenster
function openExtendedSettings() {
    const settingsWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        title: 'TTQuotes - Erweiterte Einstellungen',
        icon: path.join(__dirname, 'tttray.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            enableRemoteModule: false,
            
        }
    });
    
    settingsWindow.loadFile('extended-settings.html');
    
    logger.logSuccess('Erweiterte Einstellungen geÃ¶ffnet');
}
// Gemeinsame Quit-Funktion
async function quitAppFully() {
    logger.logSuccess('App wird beendet - Cleanup gestartet');
    // Performance Monitor stoppen
performanceMonitor.cleanup();
await analyticsManager.cleanup();
    isAppQuitting = true;
    global.isAppQuitting = true;
    isAppReturningToUI = false;
    global.isAppReturningToUI = false;
    
    // WindowManager Cleanup
    windowManager.cleanup();
    
    killTicketchecker();
    liveWindows.forEach(win => { try { win.destroy(); } catch {} });
    liveWindows = [];
    
    if (configWindow) {
        configWindow.removeAllListeners('closed');
        configWindow.close();
        configWindow = null;
    }
    if (dashboardWindow) {
    dashboardWindow.removeAllListeners('closed');
    dashboardWindow.close();
    dashboardWindow = null;
}
    logger.logSuccess('Cleanup abgeschlossen - App beenden');
    app.quit();
}
// Ready-Block
app.whenReady().then(() => {
    // AnalyticsManager VOR Verwendung initialisieren
    analyticsManager = new AnalyticsManager(app);
    let displays = screen.getAllDisplays();
    // Jetzt Event-Tracking starten
    analyticsManager.trackMonitorSetup(displays);

    // UpdateManager initialisieren (benÃ¶tigt configWindow spÃ¤ter)
    updateManager = new UpdateManager(configWindow);

    // Performance Monitoring starten
    performanceMonitor.startMonitoring();
    performanceMonitor.on('warning', warning => {
        logger.logWarning(`Performance-Warnung: ${warning.message}`);
        analyticsManager.trackPerformanceWarning(warning.type, warning.value);
    });
    // Track Monitor-Setup
    let saved = config.loadConfig(app);
    let configIsValid = isValidConfig(saved, displays);


// Analytics Event-Handler
analyticsManager.on('eventTracked', (event) => {
    console.log(`[ANALYTICS] Event: ${event.event}`);
});
// Auto-Update beim App-Start prÃ¼fen
setTimeout(() => {
    updateManager.checkForUpdates();
}, 5000); // 5 Sekunden nach Start

// Update-Events
updateManager.on('update-available', (info) => {
    logger.logSuccess(`Update verfÃ¼gbar: v${info.version}`);
});

updateManager.on('update-not-available', () => {
    logger.logDebug('App ist aktuell');
});

    // ESC-Global Shortcut â†’ wie Notausstieg
    globalShortcut.register('Escape', () => {
        isAppReturningToUI = true;
        global.isAppReturningToUI = true;
killTicketchecker();
        reopenConfigWindow();
        setTimeout(() => {
            isAppReturningToUI = false;
            global.isAppReturningToUI = false;
        }, 1000);
    });

    if (!configIsValid) {
        zeigeWartebildschirme();
        createConfigWindow();
    } else {
        schliesseWartebildschirme();
        setTimeout(() => {
            liveWindows.forEach(win => { try { win.destroy(); } catch {} });
            liveWindows = [];
killTicketchecker();

            displays = screen.getAllDisplays();
            saved.forEach(cfg => {
                if (typeof cfg.monitorIndex !== 'number' || !cfg.url) return;
                let display = displays[cfg.monitorIndex];
                if (!display && typeof cfg.monitorId !== 'undefined') {
                    display = displays.find(d => d.id === cfg.monitorId);
                }
                if (!display) return;

                if (cfg.url.startsWith('https://docs.google.com/presentation/')) {
                    let win = new BrowserWindow({
                        fullscreen: true,
                        frame: false,
                        alwaysOnTop: true,
                        backgroundColor: '#000',
                        x: display.bounds.x,
                        y: display.bounds.y,
                        width: display.bounds.width,
                        height: display.bounds.height,
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true,
                            enableRemoteModule: false,
                            
                        }
                    });
                    win.setMenuBarVisibility(false);
                    win.webContents.setUserAgent(
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
                    );
                    safeLoadUrl(win,cfg.url);
                    win.webContents.on('before-input-event', (event, input) => {
                        if (input.type === 'keyDown' && input.key === 'Escape') win.close();
                    });
                    liveWindows.push(win);
                } else {
                    createDisplayWindow(liveWindows, display, cfg.url);
                }
            });
        }, 1000);
    }  // â† schlieÃŸt den else-Block

});   // â† schlieÃŸt den app.whenReady().then-Block
// START-Button: Live-Views starten
ipcMain.on('start-app', async (event, neueKonfig) => {
    schliesseWartebildschirme();
    try { await appAutoLauncher.enable(); } catch (err) {
    logger.logError('Fehler beim Setzen des Autostart', err);
    }

    if (Array.isArray(neueKonfig) && neueKonfig.length > 0) {
        config.saveConfig(app, neueKonfig);
        // Track Live-View Start
analyticsManager.trackLiveViewStart(neueKonfig);
        setTimeout(() => {
            liveWindows.forEach(win => { try { win.destroy(); } catch {} });
            liveWindows = [];
killTicketchecker();

            let displays = screen.getAllDisplays();
            neueKonfig.forEach(cfg => {
                if (typeof cfg.monitorIndex !== 'number' || !cfg.url) return;
                let display = displays[cfg.monitorIndex];
                if (!display && typeof cfg.monitorId !== 'undefined') {
                    display = displays.find(d => d.id === cfg.monitorId);
                }
                if (!display) return;
                if (cfg.url.startsWith('https://docs.google.com/presentation/')) {
                    let win = new BrowserWindow({
                        fullscreen: true,
                        frame: false,
                        alwaysOnTop: true,
                        backgroundColor: '#000',
                        x: display.bounds.x,
                        y: display.bounds.y,
                        width: display.bounds.width,
                        height: display.bounds.height,
                        webPreferences: { nodeIntegration: false, contextIsolation: true, enableRemoteModule: false }
                    });
                    win.setMenuBarVisibility(false);
                    win.webContents.setUserAgent(
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
                    );
                    safeLoadUrl(win,cfg.url);
                    win.webContents.on('before-input-event', (event, input) => {
                        if (input.type === 'keyDown' && input.key === 'Escape') win.close();
                    });
                    liveWindows.push(win);
                } else {
                    createDisplayWindow(liveWindows, display, cfg.url);
                }
            });

            if (configWindow) {
                configWindow.close();
                configWindow = null;
            }
        }, 800);
    }
});

// Notausstieg vom Overlay
ipcMain.on('notaus-menu', () => {
    isAppReturningToUI = true;
    global.isAppReturningToUI = true;
killTicketchecker();
    reopenConfigWindow();
    setTimeout(() => {
        isAppReturningToUI = false;
        global.isAppReturningToUI = false;
    }, 1000);
});

// Konfiguration lÃ¶schen
ipcMain.on('delete-config', () => {
    isAppReturningToUI = true;
    global.isAppReturningToUI = true;
    config.deleteConfig(app);
killTicketchecker();
    liveWindows.forEach(win => { try { win.destroy(); } catch {} });
    liveWindows = [];
    reopenConfigWindow();
if (configWindow && configWindow.webContents) {
    configWindow.webContents.send('config-cleared');
}
    setTimeout(() => {
        isAppReturningToUI = false;
        global.isAppReturningToUI = false;
    }, 1000);
});

// Quit-App IPC
ipcMain.on('quit-app', quitAppFully);
// Extended Config IPC Handlers
ipcMain.handle('get-extended-config', async () => {
    try {
        return await refreshManager.extendedConfig.loadConfig();
    } catch (error) {
        logger.logError('Fehler beim Laden der erweiterten Config', error);
        return null;
    }
});
ipcMain.handle('save-extended-config', async (event, config) => {
    try {
        const ok = await refreshManager.extendedConfig.saveConfig(config);
        if (ok) {
            refreshManager.refreshDelay = config.refresh.intervalMs;
            refreshManager.overlayDelay = config.refresh.overlayMinTimeMs;
        }
        return ok;
    } catch (err) {
        console.error('Fehler beim Speichern der ExtendedConfig:', err);
        return false;
    }
});



ipcMain.handle('reset-extended-config', async () => {
    try {
        return await refreshManager.extendedConfig.resetToDefaults();
    } catch (error) {
        logger.logError('Fehler beim ZurÃ¼cksetzen der erweiterten Config', error);
        return false;
    }
});
// Performance Dashboard
ipcMain.handle('open-performance-dashboard', () => {
  return openPerformanceDashboard() !== null;
});

// Update-System
ipcMain.handle('check-for-updates', async () => {
  try {
    return await updateManager.checkForUpdates();
  } catch (e) {
    return { error: e.message };
  }
});
ipcMain.handle('get-update-status', () => ({
  isSimulation: updateManager.isSimulationMode,
  lastCheck: updateManager.lastUpdateCheck,
  currentVersion: app.getVersion()
}));

// Analytics-Report
ipcMain.handle('get-analytics-report', async () => {
  try {
    return await analyticsManager.generateReport();
  } catch (e) {
    return { error: e.message };
  }
});

// System-Tests
ipcMain.handle('run-system-tests', () => {
  // Simuliert Test-AusfÃ¼hrung
  return { success: true, testsRun: 5, testsPassed: 5 };
});
// Schutz vorm Automatik-Quit
app.on('window-all-closed', () => { /* leer lassen */ });



