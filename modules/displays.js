const { app, BrowserWindow } = require('electron');
const { getRefreshManager } = require('./refreshManagerSingleton');
const refreshManager = getRefreshManager(app);
const WindowManager = require('./WindowManager');
const path = require('path');
const utils = require('./utils');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const { safeLoadUrl } = require('./safeload');
const logger = require('./logger');
let ticketcheckerProcess = null;
const displayWindowManager = new WindowManager();
const DisplayService = require('./DisplayService');
let displayService = null; // Wird später initialisiert
// Initialisiert DisplayService nur einmal
function getDisplayService() {
  if (!displayService) {
    displayService = new DisplayService();
    
    // Event-Handler für Display-Änderungen
    displayService.on('display-added', (newDisplay) => {
      const logger = require('./logger');
      logger.logSuccess('Neuer Monitor verfügbar - eventuell Konfiguration anpassen');
    });

    displayService.on('display-removed', (oldDisplay) => {
      const logger = require('./logger');
      logger.logWarning('Monitor entfernt - prüfe laufende Fenster');
      // Hier könnte automatisches Remapping implementiert werden
    });

    displayService.on('invalid-configs-detected', (invalidConfigs) => {
      const logger = require('./logger');
      logger.logWarning(`${invalidConfigs.length} ungültige Monitor-Konfigurationen erkannt`);
    });
  }
  return displayService;
}
// === Ticketchecker-Chrome-Launcher, NUR HIER: ===
function startTicketcheckerChrome(display) {
    const x = display?.bounds?.x || 0;
    const y = display?.bounds?.y || 0;
    const width = display?.bounds?.width || 1920;
    const height = display?.bounds?.height || 1080;

    const chromePaths = [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
    ];
    const chromePath = chromePaths.find(p => fs.existsSync(p));

    const userDataDir = path.join(app.getPath('userData'), 'ticketchecker-chrome-profile');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const args = [
        `--user-data-dir=${userDataDir}`,
        '--new-window',
        '--kiosk',
        `--window-position=${x},${y}`,
        `--window-size=${width},${height}`,
        '--disable-infobars',
        '--no-first-run',
        '--disable-session-crashed-bubble',
        'https://shop.tiptorro.com/ticketchecker'
    ];

    if (!chromePath) {
        logger.logError('Chrome nicht gefunden – Ticketscanner kann nicht gestartet werden!');
        return;
    }
    if (ticketcheckerProcess && !ticketcheckerProcess.killed) {
        try {
            if (process.platform === 'win32') {
                execSync(`taskkill /PID ${ticketcheckerProcess.pid} /T /F`);
            } else {
                process.kill(ticketcheckerProcess.pid, 'SIGKILL');
            }
        } catch (e) { /* ignorieren */ }
        ticketcheckerProcess = null;
    }
    logger.logInfo('[TICKETCHECKER] Starte Chrome mit:', chromePath, args.join(' '));
    const proc = spawn(chromePath, args, { detached: true, stdio: 'ignore' });
    ticketcheckerProcess = proc;
}

// === Fenstererstellung ===
function createDisplayWindow(liveWindows, display, url) {
    const x = display?.bounds?.x || 0;
    const y = display?.bounds?.y || 0;
    const width = display?.bounds?.width || 1920;
    const height = display?.bounds?.height || 1080;

    // Ticketchecker immer in Chrome!
    if (url.startsWith('https://shop.tiptorro.com/ticketchecker')) {
        startTicketcheckerChrome(display);
        return;
    }

    // Ungültige URL abfangen
    if (!(utils.isHttpUrl(url) || url.startsWith('file://'))) {
        logger.logWarning('Ungültige oder leere URL, lade Platzhalter.');
        const failWin = new BrowserWindow({
            x, y, width, height,
            frame: false,
            fullscreen: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            focusable: false,
            backgroundColor: '#000',
            webPreferences: {nodeIntegration: false,contextIsolation: true,backgroundThrottling: false}
        });
        // weiterlaufen auch wenn unsichtbar/geparkt
        failWin.webContents.setBackgroundThrottling(false);

        failWin.loadFile(path.join(__dirname, '../invalid.html'));
        liveWindows.push(failWin);
        return;
    }

    // === Standardweg für alle anderen URLs ===
    const win = new BrowserWindow({
        x, y, width, height,
        frame: false,
        fullscreen: true,
        skipTaskbar: true,
        focusable: false,
        alwaysOnTop: true,
        backgroundColor: '#000000',
        webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  preload: path.join(__dirname, '../preload.js'),
  webSecurity: true,
  experimentalFeatures: true,
    backgroundThrottling: false
}
    });
    // weiterlaufen auch wenn versteckt/geparkt
win.webContents.setBackgroundThrottling(false);
// Notaus-Button einfügen
    win.webContents.on('did-finish-load', () => {
        win.webContents.executeJavaScript(`
            (function() {
                var escBtn = document.createElement('div');
                escBtn.style.position = 'fixed';
                escBtn.style.left = '0';
                escBtn.style.top = '0';
                escBtn.style.width = '16px';
                escBtn.style.height = '100vh';
                escBtn.style.background = '#000';
                escBtn.style.opacity = '0.012';
                escBtn.style.zIndex = '2147483647';
                escBtn.style.pointerEvents = 'auto';
                escBtn.style.cursor = 'pointer';
                escBtn.title = 'Notausstieg';
                escBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.postMessage({ type: 'NOTAUS_MENU' }, '*');
                });
                document.body.appendChild(escBtn);
            })();
        `);
    });
    win.webContents.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36'
    );

    safeLoadUrl(win,url)
      .catch(err => logger.logError('[DISPLAY] Fehler beim Laden der Start-URL:', err));

    win.webContents.once('did-finish-load', () => {
        logger.logInfo('[DISPLAY] Start-URL geladen (did-finish-load), bereit für Overlay-Refresh:', url);

        refreshManager.addWindow(win, {
            url: url,
            refreshDelay: liveWindows.length * 1000
        });

        if (!refreshManager.isRunning) {
            refreshManager.startCoordinatedRefresh();
        }
        liveWindows.push(win);
    });
}

// === Hilfsfunktion Wrapper war — entfernt ===
// tryLoad() ist nicht mehr nötig, da wir den Wrapper nicht mehr verwenden


// === Weitere Hilfsfunktionen ===
function closeTicketcheckerWindow() {
    if (ticketcheckerProcess && !ticketcheckerProcess.killed) {
        try {
            if (process.platform === 'win32') {
                execSync(`taskkill /PID ${ticketcheckerProcess.pid} /T /F`);
            } else {
                process.kill(ticketcheckerProcess.pid, 'SIGKILL');
            }
        } catch (e) { /* ignorieren */ }
        ticketcheckerProcess = null;
    }
}

function showMonitorNumbers(previewWindows, displayInfo, displays) {
    displayInfo.length = 0;
    displays.forEach((d, i) => {
        displayInfo.push({
            id: d.id,
            index: i,
            label: `Anzeige ${i + 1} - ${d.bounds.width}x${d.bounds.height}`,
            bounds: d.bounds
        });
    });

    displayInfo.forEach((info, i) => {
        const previewWin = new BrowserWindow({
            x: info.bounds.x,
            y: info.bounds.y,
            width: info.bounds.width,
            height: info.bounds.height,
            frame: false,
            fullscreen: true,
            alwaysOnTop: true,
            focusable: false,
            skipTaskbar: true,
            backgroundColor: '#000',
            webPreferences: { nodeIntegration: false, backgroundThrottling: false }
        });
            previewWin.webContents.setBackgroundThrottling(false);
        
        const html = `
            <html><head><meta charset="utf-8">
            <style>
                body {
                    margin: 0;
                    background: black;
                    color: white;
                    font-size: 6vw;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-start;
                    height: 100vh;
                    padding: 0vw;
                }
                .number {
                    font-weight: bold;
                    font-size: 6vw;
                }
            </style></head>
            <body><div class="number">${i + 1}</div></body>
            </html>
        `;

        safeLoadUrl(previewWin,'data:text/html;charset=utf-8,' + encodeURIComponent(html));
        previewWindows.push(previewWin);
    });
}

function cleanupDisplayWindows() {
    logger.logInfo('[DISPLAYS] Display-Window-Cleanup gestartet');
    refreshManager.cleanup();
    displayWindowManager.cleanup();
}

// === Exporte ===
module.exports = {
    createDisplayWindow,
    closeTicketcheckerWindow,
    showMonitorNumbers,
    cleanupDisplayWindows
};

