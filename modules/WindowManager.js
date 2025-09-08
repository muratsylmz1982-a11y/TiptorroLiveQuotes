// modules/WindowManager.js
const { BrowserWindow } = require('electron');
const logger = require('./logger');


const { isAllowedUrl, ENFORCE } = require('./allowlist');
/** Lädt URLs sicher: erlaubt -> loadURL; verboten -> blockieren bei ENFORCE, sonst erlauben (Monitor-Only). */
function safeLoadUrl(win, url, opts) {
  try {
    if (isAllowedUrl(url)) {
      return safeLoadUrl(win,url, opts);
    }
    if (ENFORCE) {
      try { console.warn('[allowlist][block]', url); } catch {}
      return Promise.resolve(); // nichts laden
    }
    try { console.warn('[allowlist][monitor]', url); } catch {}
    return safeLoadUrl(win,url, opts);
  } catch (e) {
    try { console.warn('[safeLoadUrl][err]', e && e.message ? e.message : e); } catch {}
    return Promise.resolve();
  }
}
class WindowManager {
    constructor() {
        this.windows = new Map();
        this.overlays = new Map();
        this.liveWindows = [];
    }
    
    // Registriert ein Fenster für automatisches Cleanup
    registerWindow(id, window, type = 'window') {
        if (type === 'overlay') {
            this.overlays.set(id, window);
        } else {
            this.windows.set(id, window);
        }
        
        // Automatisches Cleanup bei Fenster-Schließung
        window.on('closed', () => {
            if (type === 'overlay') {
                this.overlays.delete(id);
            } else {
                this.windows.delete(id);
            }
        });
    }
    
    // Erstellt ein Overlay-Fenster mit automatischem Tracking
    createOverlay(config) {
        // weiterlaufen auch wenn versteckt/geparkt
    config.webPreferences = Object.assign({}, config.webPreferences, { backgroundThrottling: false });
    const overlay = new BrowserWindow(config);
    overlay.webContents.setBackgroundThrottling(false);
        const id = overlay.id;
        
        this.registerWindow(id, overlay, 'overlay');
        
        console.log(`[WINDOW-MANAGER] Overlay ${id} erstellt`);
        return overlay;
    }
    
    // Erstellt ein Live-Display-Fenster
    createLiveWindow(config) {
        // weiterlaufen auch wenn versteckt/geparkt
    config.webPreferences = Object.assign({}, config.webPreferences, { backgroundThrottling: false });
    const window = new BrowserWindow(config);
    window.webContents.setBackgroundThrottling(false);
        this.liveWindows.push(window);
        this.registerWindow(window.id, window);
        
        console.log(`[WINDOW-MANAGER] Live-Window ${window.id} erstellt`);
        return window;
    }
    
    // Schließt alle Overlay-Fenster sicher
    closeAllOverlays() {
        console.log(`[WINDOW-MANAGER] Schließe ${this.overlays.size} Overlays`);
        this.overlays.forEach(overlay => {
            try {
                if (!overlay.isDestroyed()) {
                    overlay.removeAllListeners();
                    overlay.destroy();
                }
            } catch (error) {
  logger.logError('[WINDOW-MANAGER] Fehler beim Overlay-Cleanup', error);
}
        });
        this.overlays.clear();
    }
    
    // Schließt alle Live-Fenster sicher
    closeAllLiveWindows() {
        console.log(`[WINDOW-MANAGER] Schließe ${this.liveWindows.length} Live-Windows`);
        this.liveWindows.forEach(window => {
            try {
                if (!window.isDestroyed()) {
                    window.removeAllListeners();
                    window.destroy();
                }
            } catch (error) {
  logger.logError('[WINDOW-MANAGER] Fehler beim Overlay-Cleanup', error);
}
        });
        this.liveWindows = [];
    }
    
    // Komplett-Cleanup aller Fenster
    cleanup() {
        console.log('[WINDOW-MANAGER] Vollständiges Cleanup gestartet');
        this.closeAllOverlays();
        this.closeAllLiveWindows();
        
        // Zusätzliche Windows
        this.windows.forEach(window => {
            try {
                if (!window.isDestroyed()) {
                    window.removeAllListeners();
                    window.destroy();
                }
            } catch (error) {
  logger.logError('[WINDOW-MANAGER] Fehler beim Overlay-Cleanup', error);
}
        });
        this.windows.clear();
        
        console.log('[WINDOW-MANAGER] Cleanup abgeschlossen');
    }
    
    // Status-Info für Debugging
    getStatus() {
        return {
            windows: this.windows.size,
            overlays: this.overlays.size,
            liveWindows: this.liveWindows.length
        };
    }
}

module.exports = WindowManager;
