// modules/WindowManager.js
const { BrowserWindow } = require('electron');
const logger = require('./logger');

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
        
        logger.logInfo(`[WINDOW-MANAGER] Overlay ${id} erstellt`);
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
        
        logger.logInfo(`[WINDOW-MANAGER] Live-Window ${window.id} erstellt`);
        return window;
    }
    
    // Schließt alle Overlay-Fenster sicher
    closeAllOverlays() {
        logger.logInfo(`[WINDOW-MANAGER] Schließe ${this.overlays.size} Overlays`);
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
        logger.logInfo(`[WINDOW-MANAGER] Schließe ${this.liveWindows.length} Live-Windows`);
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
        logger.logInfo('[WINDOW-MANAGER] Vollständiges Cleanup gestartet');
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
        
        logger.logSuccess('[WINDOW-MANAGER] Cleanup abgeschlossen');
    }
    
    // Gibt Anzahl aktiver Live-Windows zurück (für Performance-Monitoring)
    getActiveLiveWindowCount() {
        try {
            // Zähle nur nicht-destroyed Live-Windows
            if (!this.liveWindows || !Array.isArray(this.liveWindows)) {
                return 0;
            }
            return this.liveWindows.filter(win => win && !win.isDestroyed()).length;
        } catch (err) {
            // Fehler abfangen, falls windowManager noch nicht vollständig initialisiert ist
            return 0;
        }
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
