const allowlist = require('./allowlist');

function isHttp(url) { return /^https?:/i.test(url); }

/** Sicheres Laden von URLs in BrowserWindow */
function safeLoadUrl(win, url, opts) {
  try {
    // Interne Schemata (file:, data:, about:) immer erlauben
    if (!isHttp(url)) {
      return win.loadURL(url, opts);
    }

    // HTTP(S): gegen Allowlist prüfen (dynamisch aus JSON)
    const allowed = allowlist.isAllowedUrl(url);
    if (allowed) {
      return win.loadURL(url, opts);
    }

    // Durchsetzung aktiv? -> blockieren
    if (allowlist.isEnforced()) {
      try { console.warn('[allowlist][block]', url); } catch {}
      return Promise.resolve(); // nichts laden
    }

    // Monitor-Only: laden, aber warnen
    try { console.warn('[allowlist][monitor]', url, 'nicht erlaubt (Config)'); } catch {}
    return win.loadURL(url, opts);
  } catch (e) {
    try { console.warn('[safeLoadUrl][err]', e && e.message ? e.message : e); } catch {}
    return Promise.resolve();
  }
}

module.exports = { safeLoadUrl };
