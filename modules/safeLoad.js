const { ENFORCE, isAllowedUrl } = require('./allowlist');

function isHttp(url) {
  return /^https?:/i.test(url);
}

/**
 * Lädt URLs sicher:
 * - Nicht-HTTP(S) (file:, data:, about:) -> immer erlauben (intern/Overlays)
 * - HTTP(S):
 *    * erlaubt laut Allowlist -> loadURL
 *    * verboten:
 *        - ENFORCE: blockieren (kein load)
 *        - Monitor-Only: erlauben, aber warnen
 */
function safeLoadUrl(win, url, opts) {
  try {
    if (!isHttp(url)) {
      return win.loadURL(url, opts);
    }
    if (isAllowedUrl(url)) {
      return win.loadURL(url, opts);
    }
    if (ENFORCE) {
      try { console.warn('[allowlist][block]', url); } catch {}
      return Promise.resolve(); // nichts laden
    }
    try { console.warn('[allowlist][monitor]', url); } catch {}
    return win.loadURL(url, opts);
  } catch (e) {
    try { console.warn('[safeLoadUrl][err]', e && e.message ? e.message : e); } catch {}
    return Promise.resolve();
  }
}

module.exports = { safeLoadUrl };
