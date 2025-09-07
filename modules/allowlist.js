const fs = require('fs');
const path = require('path');

const CFG_PATH = path.join(__dirname, '..', 'config', 'allowlist.json');

let ORIGINS = [];
let PREFIXES = [];
let ENFORCE = false;

function loadConfig() {
  try {
    const raw = fs.readFileSync(CFG_PATH, 'utf8');
    const json = JSON.parse(raw);
    ORIGINS = Array.isArray(json.origins) ? json.origins.map(s => String(s).trim()).filter(Boolean) : [];
    PREFIXES = Array.isArray(json.pathPrefixes) ? json.pathPrefixes.map(s => String(s).trim()).filter(Boolean) : [];
    ENFORCE = !!json.enforce;
  } catch {
    // Defaults bleiben leer/false
  }
}
loadConfig();

function isAllowedUrl(raw) {
  try {
    const u = new URL(raw);

    // Lokale/Interne Navigationsziele IMMER erlauben (für App-HTMLs & about:blank)
    if (u.protocol === 'file:' || u.protocol === 'about:') return true;

    const originAllowed = ORIGINS.some(o => u.origin === o);
    const prefixAllowed = PREFIXES.some(p => raw.startsWith(p));
    const allowed = originAllowed || prefixAllowed;

    if (!allowed && !ENFORCE) {
      try { console.warn('[allowlist][monitor]', u.href, 'nicht erlaubt (Config)'); } catch {}
      return true; // Monitor-Only: erlauben, nur warnen
    }
    return allowed;
  } catch {
    // Ungültige URL -> lieber blocken (außer im Monitor-Only, s.u.)
    return !ENFORCE;
  }
}

module.exports = {
  get ORIGINS() { return ORIGINS.slice(); },
  get PREFIXES() { return PREFIXES.slice(); },
  get ENFORCE() { return ENFORCE; },
  isAllowedUrl,
  loadConfig
};
