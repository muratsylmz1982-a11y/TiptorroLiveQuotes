// modules/monitor-service.js
const { app, screen, BrowserWindow, ipcMain } = require('electron');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

// Debounce mit .cancel()
const debounce = (fn, ms = 750) => {
  let t;
  const f = (...a) => { clearTimeout(t); t = setTimeout(() => { try { fn(...a); } catch {} }, ms); };
  f.cancel = () => clearTimeout(t);
  return f;
};

// Helpers
const safeBounds = (win) => { try { if (!win || win.isDestroyed()) return null; return win.getBounds(); } catch { return null; } };
const safeDisplayMatching = (b) => { try { return screen.getDisplayMatching(b); } catch { try { return screen.getPrimaryDisplay(); } catch { return null; } } };
const safeURL = (wc) => { try { return wc?.getURL?.() || ''; } catch { return ''; } };
const storePath = () => { try { return path.join(app.getPath('userData'), 'window-layout.json'); } catch { return null; } };
const rectsIntersect = (a, b) => a && b && !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

// Identity (Live-Seiten eindeutig per page)
function identityFromURL(u) {
  if (!u || u === 'about:blank') return null;
  try {
    const url = new URL(u);
    if (url.pathname.includes('livetv')) {
      const page = url.searchParams.get('page') || url.searchParams.get('p') || '1';
      return `live:page=${page}`;
    }
    url.hash = '';
    return `url:${url.toString()}`;
  } catch { return null; }
}

// Identity eines Fensters ermitteln (aus Map oder URL)
function getIdentityForWin(self, win) {
  try {
    const id = self.ident.get(win.id);
    if (id) return id;
    const u = safeURL(win.webContents);
    return identityFromURL(u);
  } catch { return null; }
}

class MonitorService extends EventEmitter {
  constructor() {
    super();
    this.snapshot = [];
    this._onChange = debounce(() => this._emitChange(), 400);
    this._bound = false;

    // Nur zur Laufzeit parken – Nach Neustart nicht auto-parken
    this._startedAt = Date.now();
    this._startupGraceMs = 4000; // während dieser Zeit wird NICHT geparkt

    // Freeze-Fenster für Home-Updates nach Display-Removal
    this._freezeHomeUntil = 0;

    // Laufzeit-Maps
    this.home = new Map();    // winId -> { displayId, width, height }
    this.parked = new Set();  // Set(winId)
    this.ident = new Map();   // winId -> identity

    // Persistenz (nur Ziel-Display/Größe merken)
    this.layout = { windows: {} }; // identity -> { displayId, width, height }
    this._saveLayoutDebounced = debounce(() => this._saveLayout(), 250);
    this._storePath = null;

    // Sofortparken bei tatsächlichem Abziehen (zur Laufzeit)
    this._onDisplayRemovedImmediate = (_e, disp) => this._handleDisplayRemoved(disp);
  }

  _shouldFreezeHome() { return Date.now() < this._freezeHomeUntil; }

  _loadLayout() {
    try {
      this._storePath = storePath();
      if (this._storePath && fs.existsSync(this._storePath)) {
        const j = JSON.parse(fs.readFileSync(this._storePath, 'utf8'));
        if (j && j.windows) this.layout = j;
      }
    } catch {}
  }
  _saveLayout() {
    try {
      if (!this._storePath) this._storePath = storePath();
      if (!this._storePath) return;
      fs.mkdirSync(path.dirname(this._storePath), { recursive: true });
      fs.writeFileSync(this._storePath, JSON.stringify(this.layout, null, 2), 'utf8');
    } catch {}
  }

  _afterStartupGrace() {
    return (Date.now() - this._startedAt) > this._startupGraceMs;
  }

  start() {
    if (this._bound) return;
    const bind = () => {
      if (this._bound) return;
      this._bound = true;

      this._loadLayout();

      app.on('browser-window-created', (_e, win) => this._registerWindow(win));

      this.snapshot = this._snapshot();
      screen.on('display-added', this._onChange);
      screen.on('display-removed', this._onChange);
      screen.on('display-metrics-changed', this._onChange);
      screen.on('display-removed', this._onDisplayRemovedImmediate);

      for (const win of BrowserWindow.getAllWindows()) this._registerWindow(win);
    };
    if (app.isReady()) bind(); else app.once('ready', bind);
  }

  stop() {
    if (!this._bound) return;
    screen.off('display-added', this._onChange);
    screen.off('display-removed', this._onChange);
    screen.off('display-metrics-changed', this._onChange);
    screen.off('display-removed', this._onDisplayRemovedImmediate);
    this._bound = false;
  }

  _snapshot() {
    try {
      return screen.getAllDisplays().map(d => ({
        id: d.id, bounds: d.bounds, workArea: d.workArea,
        scale: d.scaleFactor, rotation: d.rotation, internal: d.internal,
      }));
    } catch { return []; }
  }
  _displaySet() { return new Set(this.snapshot.map(d => d.id)); }
  _getDisplayById(id) { return this.snapshot.find(d => d.id === id) || null; }

  _emitChange() {
    this.snapshot = this._snapshot();
    this._reconcileWindows(); // Park/Unpark nur nach Grace
    this.emit('changed', this.getStatus());
  }

  // Laufzeit: sofort parken, damit nichts auf Primär fällt
  _handleDisplayRemoved(display) {
    try {
      const removedId = display?.id;
      const removedBounds = display?.bounds;

      // Freeze für Home-Updates: OS verschiebt ggf. kurz → nicht übernehmen
      this._freezeHomeUntil = Date.now() + 1500;

      for (const win of BrowserWindow.getAllWindows()) {
        if (!win || win.isDestroyed()) continue;

        // Primär: nach Identity/Persistenz prüfen
        const identity = getIdentityForWin(this, win);
        const saved = identity ? this.layout.windows[identity] : null;
        if (saved && saved.displayId === removedId) {
          try { win.setFullScreen(false); } catch {}
          this._park(win);
          continue;
        }

        // Fallback: alte Heimat / aktuelle Bounds
        const info = this.home.get(win.id);
        const bCur = safeBounds(win);
        if ((info && info.displayId === removedId) ||
            (bCur && removedBounds && rectsIntersect(bCur, removedBounds))) {
          try { win.setFullScreen(false); } catch {}
          this._park(win);
        }
      }
    } catch {}
  }

  _registerWindow(win) {
    try {
      if (!win || win.isDestroyed()) return;

      win.webContents?.setBackgroundThrottling?.(false);

      // RUNTIME-Heimat initial (keine Aktion)
      const b0 = safeBounds(win);
      const d0 = b0 ? safeDisplayMatching(b0) : (screen.getPrimaryDisplay?.() ?? null);
      const w0 = (b0 && b0.width) || 1024;
      const h0 = (b0 && b0.height) || 768;
      if (d0) this.home.set(win.id, { displayId: d0.id, width: w0, height: h0 });

      // Identity binden und Persistenz laden – aber KEIN Parken beim Start!
      const tryBindIdentity = () => {
        if (!win || win.isDestroyed()) return;
        if (this.ident.has(win.id)) return;

        const id = identityFromURL(safeURL(win.webContents));
        if (!id) return;

        this.ident.set(win.id, id);
        const saved = this.layout.windows[id];

        if (saved) {
          // Heimat für späteres Unpark merken
          const cur = this.home.get(win.id) || {};
          const w = saved.width || cur.width || 1024;
          const h = saved.height || cur.height || 768;
          this.home.set(win.id, { displayId: saved.displayId, width: w, height: h });

          // Beim Start NICHT parken, auch wenn Display fehlt.
        } else {
          // Erstmalig speichern NUR wenn >1 Monitore, um Primär-Fallback nicht zu persistieren
          if (this._displaySet().size > 1) {
            const b = safeBounds(win);
            const d = b && safeDisplayMatching(b);
            if (d) {
              this.layout.windows[id] = { displayId: d.id, width: b.width, height: b.height };
              this.home.set(win.id, { displayId: d.id, width: b.width, height: b.height });
              this._saveLayoutDebounced();
            }
          }
        }
      };

      // Früh binden
      win.webContents?.on('did-start-navigation', (_e, _url, _inPlace, isMain) => { if (isMain) tryBindIdentity(); });
      win.webContents?.once('did-finish-load', tryBindIdentity);
      win.webContents?.on('did-navigate', tryBindIdentity);
      win.webContents?.on('did-navigate-in-page', tryBindIdentity);
      setTimeout(tryBindIdentity, 0);

      // RUNTIME-Heimat aktuell halten; Persist nur wenn >1 Monitore & nicht geparkt
      const updateHome = debounce(() => {
        // während Freeze keine Home-Änderungen übernehmen
        if (this._shouldFreezeHome()) return;

        const b2 = safeBounds(win);
        if (!b2) return;
        const d2 = safeDisplayMatching(b2);
        if (!d2) return;
        this.home.set(win.id, { displayId: d2.id, width: b2.width, height: b2.height });

        const id = this.ident.get(win.id);
        if (id && !this.parked.has(win.id) && this._displaySet().size > 1) {
          this.layout.windows[id] = { displayId: d2.id, width: b2.width, height: b2.height };
          this._saveLayoutDebounced();
        }
      }, 150);

      const onMove = () => updateHome();
      const onResize = () => updateHome();

      win.on('move', onMove);
      win.on('resize', onResize);
      win.on('closed', () => {
        try { win.removeListener('move', onMove); win.removeListener('resize', onResize); } catch {}
        updateHome.cancel?.();
        this.home.delete(win.id);
        this.parked.delete(win.id);
        this.ident.delete(win.id);
      });
    } catch {}
  }

  _park(win) {
    try {
      if (!win || win.isDestroyed()) return;
      if (this.parked.has(win.id)) return;
      win.hide();
      this.parked.add(win.id);
    } catch {}
  }

  _unpark(win, display) {
    try {
      if (!win || win.isDestroyed()) return;
      if (!this.parked.has(win.id)) return;

      const info = this.home.get(win.id) || {};
      const w = info.width || 1024;
      const h = info.height || 768;
      const area = (display && (display.workArea || display.bounds)) || (screen.getPrimaryDisplay?.().workArea);

      if (area) {
        const x = Math.max(area.x + 40, area.x + Math.floor((area.width - w) / 2));
        const y = Math.max(area.y + 40, area.y + Math.floor((area.height - h) / 2));
        try { win.setBounds({ x, y, width: w, height: h }, false); } catch {}
      }
      win.show();
      try { win.moveTop?.(); } catch {}
      try { win.setFullScreen(true); } catch {}
      this.parked.delete(win.id);
    } catch {}
  }

  _reconcileWindows() {
    // während Freeze kein auto Park/Unpark
    if (this._shouldFreezeHome()) return;

    const available = this._displaySet();

    for (const win of BrowserWindow.getAllWindows()) {
      if (!win || win.isDestroyed()) continue;
      const info = this.home.get(win.id);
      if (!info) { this._registerWindow(win); continue; }

      // Nach Startup-Grace: Heimat fehlt -> parken (zur Laufzeit)
      if (this._afterStartupGrace() && !available.has(info.displayId)) {
        this._park(win);
        continue;
      }

      // Heimat da & Fenster geparkt -> entparken
      if (available.has(info.displayId) && this.parked.has(win.id)) {
        const target = this._getDisplayById(info.displayId);
        if (target) this._unpark(win, target);
        continue;
      }
    }
  }

  getStatus() {
    let primaryId = null; try { primaryId = screen.getPrimaryDisplay().id; } catch {}
    return { displays: this.snapshot, primaryId, parked: Array.from(this.parked) };
  }
}

const monitorService = new MonitorService();

ipcMain.handle('monitor:getStatus', () => monitorService.getStatus());

monitorService.on('changed', (status) => {
  for (const win of BrowserWindow.getAllWindows()) {
    try { if (!win.isDestroyed()) win.webContents.send('monitor:changed', status); } catch {}
  }
});

module.exports = { monitorService };

