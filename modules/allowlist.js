const fs = require('fs');
const path = require('path');

const CFG_PATH = path.join(__dirname, '..', 'config', 'allowlist.json');

let ALLOWED_ORIGINS = [];
let ENFORCE = false;

function loadConfig() {
  try {
    const raw = fs.readFileSync(CFG_PATH, 'utf8');
    const json = JSON.parse(raw);
    if (Array.isArray(json.origins)) {
      ALLOWED_ORIGINS = json.origins.filter(Boolean).map(s => String(s).trim());
    }
    ENFORCE = Boolean(json.enforce);
  } catch {
    // bleibt bei Defaults (leer + nicht erzwingen)
  }
}
loadConfig();

function isAllowedUrl(raw) {
  try {
    const u = new URL(raw);
    const allowed = ALLOWED_ORIGINS.some(origin => u.origin === origin);
    if (ALLOWED_ORIGINS.length === 0 || (!allowed && !ENFORCE)) {
      // Monitor-Only: erlauben, aber warnen
      try { console.warn('[allowlist][monitor]', u.origin, 'nicht in ALLOWED_ORIGINS'); } catch {}
      return true;
    }
    return allowed;
  } catch {
    return false;
  }
}

// Read-only Getter exportieren
module.exports = {
  get ALLOWED_ORIGINS() { return ALLOWED_ORIGINS.slice(); },
  get ENFORCE() { return ENFORCE; },
  isAllowedUrl,
  loadConfig
};
