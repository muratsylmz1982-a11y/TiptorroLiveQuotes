const path = require('path');
const logger = require('./logger');
const fs = require('fs');

const { safeLoadUrl } = require('./safeLoad');
class RefreshManager {
    constructor(extendedConfig) {
        this.isRunning = false;
        this.windows = [];
        this.interval = null;
        this.extendedConfig = extendedConfig;

        // Standardwerte (werden aus ExtendedConfig überschrieben)
        this.refreshDelay = 1800000; // 30 Minuten
        this.overlayDelay = 3500;    // 3,5 Sekunden
    }

    async loadConfig() {
        try {
            const config = await this.extendedConfig.loadConfig();
            this.refreshDelay = config.refresh?.intervalMs || this.refreshDelay;
            this.overlayDelay = config.refresh?.overlayMinTimeMs || this.overlayDelay;
            console.log('[REFRESH-MANAGER] Konfiguration geladen:', {
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
        refreshDelay: Math.max(this.refreshDelay, 60000), // z.B. mind. 60 Sekunden
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
        console.log('[REFRESH-MANAGER] Starte koordinierten Refreshâ€¦');
        this.interval = setInterval(() => {
            const now = Date.now();
            for (const w of this.windows) {
                if (
                    now - w.lastRefresh >= w.refreshDelay &&
                    !w.isRefreshing // NEU: Nur, wenn kein Refresh lÃ¤uft!
                ) {
                    this.refreshWindow(w);
                }
            }
        }, 1000);
    }

    stopCoordinatedRefresh() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('[REFRESH-MANAGER] Refresh gestoppt.');
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
            console.log('[REFRESH-MANAGER] Zielseite vollstÃ¤ndig geladen, Overlay ausgeblendet');
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
        console.log('[REFRESH-MANAGER] Cleanup');
        this.stopCoordinatedRefresh();
        this.windows = [];
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



