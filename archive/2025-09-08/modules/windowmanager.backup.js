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
        const overlay = new BrowserWindow(config);
        const id = overlay.id;
        
        this.registerWindow(id, overlay, 'overlay');
        
        console.log(`[WINDOW-MANAGER] Overlay ${id} erstellt`);
        return overlay;
    }
    
    // Erstellt ein Live-Display-Fenster
    createLiveWindow(config) {
        const window = new BrowserWindow(config);
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