const path = require('path');
const logger = require('./logger');
const fs = require('fs');
const { safeLoadUrl } = require('./safeload');
class RefreshManager {
    constructor(extendedConfig) {
        this.isRunning = false;
        this.windows = [];
        this.interval = null;
        this.extendedConfig = extendedConfig;
        this.refreshQueue = []; // Queue für gestaffelte Refreshes
        // Gestaffelte Refreshes: Dynamische Verzögerung basierend auf Anzahl der Fenster
        // Bei vielen Monitoren: Längere Verzögerung, um GPU-Spitzen zu vermeiden
        this.refreshStaggerDelay = 5000; // Standard: 5 Sekunden

        // Standardwerte (werden aus ExtendedConfig überschrieben)
        this.refreshDelay = 1200000; // 20 Minuten
        this.overlayDelay = 3500;    // 3,5 Sekunden
    }

    async loadConfig() {
        try {
            const config = await this.extendedConfig.loadConfig();
            this.refreshDelay = config.refresh?.intervalMs || this.refreshDelay;
            this.overlayDelay = config.refresh?.overlayMinTimeMs || this.overlayDelay;
            logger.logInfo('[REFRESH-MANAGER] Konfiguration geladen:', {
                refreshDelay: this.refreshDelay,
                overlayDelay: this.overlayDelay
            });
        } catch (err) {
  logger.logError('[REFRESH-MANAGER] Fehler beim Laden der ExtendedConfig', err);
}
    }

    addWindow(win, options = {}) {
    this.windows.push({
        window: win,
        url: (options && options.url) ? options.url : "about:blank",
        // Mindestabstand einstellen, damit Overlay niemals "sofort" kommt!
        refreshDelay: this.refreshDelay,
        overlayDelay: options.overlayDelay || this.overlayDelay,
        lastRefresh: Date.now(),      // <--- HIER wird der Timer gesetzt, sodass erst nach refreshDelay der erste Refresh kommt!
        isRefreshing: false
    });
}

    removeWindow(win) {
        this.windows = this.windows.filter(w => w.window !== win);
    }

    startCoordinatedRefresh() {
        this.isRunning = true;
        if (this.interval) return;
        
        // Dynamisches Interval: 10s bei 5+ Displays, 5s bei 3-4 Displays, sonst 1s
        // Reduziert CPU-Overhead bei vielen Monitoren
        let intervalMs = 1000;
        if (this.windows.length >= 5) {
            intervalMs = 10000; // 10 Sekunden bei 5+ Monitoren
        } else if (this.windows.length >= 3) {
            intervalMs = 5000;  // 5 Sekunden bei 3-4 Monitoren
        }
        
        logger.logInfo('[REFRESH-MANAGER] Starte koordinierten Refresh…', {
            intervalMs: intervalMs,
            windowCount: this.windows.length,
            staggerDelay: this.refreshStaggerDelay
        });
        
        this.interval = setInterval(() => {
            const now = Date.now();
            const windowsToRefresh = [];
            
            // Sammle alle Fenster, die neu geladen werden müssen
            for (const w of this.windows) {
                if (
                    now - w.lastRefresh >= w.refreshDelay &&
                    !w.isRefreshing
                ) {
                    // Prüfe, ob Fenster bereits in der Queue ist
                    const isAlreadyInQueue = this.refreshQueue.some(q => q.window === w.window);
                    if (!isAlreadyInQueue) {
                        windowsToRefresh.push(w);
                    }
                }
            }
            
            // Gestaffelte Refreshes: Ein Fenster alle 5 Sekunden statt alle gleichzeitig
            if (windowsToRefresh.length > 0) {
                this.processRefreshQueue(windowsToRefresh);
            }
        }, intervalMs);
    }
    
    /**
     * Verarbeitet Refresh-Queue mit gestaffelten Refreshes
     * Verhindert GPU-Spitzen durch gleichzeitige Reloads
     */
    processRefreshQueue(windowsToRefresh) {
        // Filtere Duplikate: Prüfe, ob Fenster bereits in der Queue ist
        const newWindows = windowsToRefresh.filter(newWin => {
            return !this.refreshQueue.some(existingWin => existingWin.window === newWin.window);
        });
        
        if (newWindows.length === 0) {
            return; // Keine neuen Fenster zum Hinzufügen
        }
        
        // Dynamische Verzögerung: Bei 5+ Fenstern längere Verzögerung (8s statt 5s)
        const staggerDelay = this.windows.length >= 5 ? 8000 : 5000;
        this.refreshStaggerDelay = staggerDelay;
        
        // Wenn bereits Refreshes laufen, zur Queue hinzufügen
        if (this.refreshQueue.length > 0) {
            this.refreshQueue.push(...newWindows);
            return;
        }
        
        // Starte gestaffelte Refreshes
        this.refreshQueue = newWindows;
        this.processNextRefresh();
    }
    
    /**
     * Verarbeitet das nächste Fenster aus der Queue
     */
    processNextRefresh() {
        if (this.refreshQueue.length === 0) {
            return;
        }
        
        const windowData = this.refreshQueue.shift();
        this.refreshWindow(windowData);
        
        // Wenn noch Fenster in der Queue sind, nach staggerDelay das nächste verarbeiten
        if (this.refreshQueue.length > 0) {
            setTimeout(() => {
                this.processNextRefresh();
            }, this.refreshStaggerDelay);
        }
    }

    stopCoordinatedRefresh() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            logger.logInfo('[REFRESH-MANAGER] Refresh gestoppt.');
        }
    }

    isExcludedFromRefresh(url) {
        const skipList = [
            'https://shop.tiptorro.com/livescoretv',
            'https://shop.tiptorro.com/livescoretv2'
        ];
        return skipList.some(base => url.startsWith(base));
    }

refreshWindow(windowData) {
    const { window, url } = windowData;

    if (!window || window.isDestroyed()) {
        this.removeWindow(window);
        return;
    }
    if (window.webContents.isLoading()) {
        return;
    }
    if (this.isExcludedFromRefresh(url)) {
        return;
    }
    if (windowData.isRefreshing) {
        return;
    }

    windowData.isRefreshing = true;
    windowData.lastRefresh = Date.now();

try {
    // Overlay EINblenden
    window.webContents.executeJavaScript("window.overlayAPI && window.overlayAPI.showOverlay();")
  .catch(err => logger.logError('[REFRESH-MANAGER] Fehler beim Overlay-Show', err));

    // <<== Overlay bleibt overlayDelay Millisekunden sichtbar, erst dann reload!
    setTimeout(() => {
        window.webContents.once('did-finish-load', () => {
            window.webContents.executeJavaScript("window.overlayAPI && window.overlayAPI.hideOverlay();")
  .catch(err => logger.logError('[REFRESH-MANAGER] Fehler beim Overlay-Hide', err));
            windowData.isRefreshing = false;
            logger.logInfo('[REFRESH-MANAGER] Zielseite vollständig geladen, Overlay ausgeblendet');
        });

        safeLoadUrl(window,url)
            .catch(err => {
  windowData.isRefreshing = false;
  window.webContents.executeJavaScript("window.overlayAPI && window.overlayAPI.hideOverlay();")
    .catch(hideErr => logger.logError('[REFRESH-MANAGER] Fehler beim Overlay-Hide nach URL-Fehler', hideErr));
  logger.logError('[REFRESH-MANAGER] Fehler beim Laden der Ziel-URL', err);
});

    }, windowData.overlayDelay || this.overlayDelay); // <<--- HIER wird overlayDelay verwendet!
} catch (error) {
  windowData.isRefreshing = false;
  window.webContents.executeJavaScript("window.overlayAPI && window.overlayAPI.hideOverlay();")
    .catch(hideErr => logger.logError('[REFRESH-MANAGER] Fehler beim Overlay-Hide nach Refresh-Fehler', hideErr));
  logger.logError('[REFRESH-MANAGER] Fehler beim Refresh', error);
}
}
    cleanup() {
        logger.logInfo('[REFRESH-MANAGER] Cleanup');
        this.stopCoordinatedRefresh();
        this.windows = [];
        this.refreshQueue = []; // Queue leeren
    }
}
module.exports = RefreshManager;

/* ===== Compat-Patch für Tests: fehlende Methode & sichere Defaults ===== */
try {
  const P = (typeof RefreshManager === 'function') ? RefreshManager.prototype : null;
  if (P) {
    // 1) Fehlende Methode bereitstellen (no-throw)
    if (typeof P.refreshAllWindows !== 'function') {
      P.refreshAllWindows = function () {
        if (!Array.isArray(this.windows)) return;
        for (const entry of this.windows) {
          const win = entry && entry.window;
          if (win && typeof win.reload === 'function') {
            try { win.reload(); } catch (_) {}
          }
        }
      };
    }

    // 2) addWindow: options-Parameter absichern (falls Tests ohne options aufrufen)
    if (typeof P.addWindow === 'function' && !P.addWindow._defaultsWrapped) {
      const _origAdd = P.addWindow;
      P.addWindow = function (win, options) {
        options = options || {};
        return _origAdd.call(this, win, options);
      };
      P.addWindow._defaultsWrapped = true;
    }

    // 3) isRunning-Flag bei Start/Stop zuverlässig setzen
    if (typeof P.startCoordinatedRefresh === 'function' && !P.startCoordinatedRefresh._flagWrapped) {
      const _origStart = P.startCoordinatedRefresh;
      P.startCoordinatedRefresh = function () {
        this.isRunning = true;
        return _origStart.apply(this, arguments);
      };
      P.startCoordinatedRefresh._flagWrapped = true;
    }
    if (typeof P.stopCoordinatedRefresh === 'function' && !P.stopCoordinatedRefresh._flagWrappedStop) {
      const _origStop = P.stopCoordinatedRefresh;
      P.stopCoordinatedRefresh = function () {
        this.isRunning = false;
        return _origStop.apply(this, arguments);
      };
      P.stopCoordinatedRefresh._flagWrappedStop = true;
    }
  }
} catch (_) {}
/* ===== Ende Compat-Patch ===== */



