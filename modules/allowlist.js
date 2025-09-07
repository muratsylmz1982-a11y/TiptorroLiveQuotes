const fs = require('fs');
const path = require('path');

const CFG_PATH = path.join(__dirname, '..', 'config', 'allowlist.json');

function readConfig() {
  try {
    const raw = fs.readFileSync(CFG_PATH, 'utf8');
    const json = JSON.parse(raw);
    const origins = Array.isArray(json.origins)
      ? json.origins.map(s => String(s).trim().toLowerCase()).filter(Boolean)
      : [];
    const prefixes = Array.isArray(json.pathPrefixes)
      ? json.pathPrefixes.map(s => String(s).trim().toLowerCase()).filter(Boolean)
      : [];
    const enforce = !!json.enforce;
    return { origins, prefixes, enforce };
  } catch {
    return { origins: [], prefixes: [], enforce: false };
  }
}

function norm(raw) {
  try {
    const u = new URL(raw);
    return { href: u.href.toLowerCase(), origin: u.origin.toLowerCase(), protocol: u.protocol };
  } catch {
    const s = String(raw || '').toLowerCase();
    return { href: s, origin: '', protocol: '' };
  }
}

function isHttp(url) { return /^https?:/i.test(url); }

function isAllowedUrl(raw) {
  const cfg = readConfig();
  const u = norm(raw);

  // interne Schemata immer erlauben (file:, data:, about:)
  if (!isHttp(u.href) || u.protocol === 'about:') return true;

  const originAllowed = cfg.origins.includes(u.origin);
  const prefixAllowed = cfg.prefixes.some(p => u.href.startsWith(p));
  return originAllowed || prefixAllowed;
}

function isEnforced() { return readConfig().enforce; }

module.exports = {
  readConfig,
  isAllowedUrl,
  isEnforced,
  // Back-compat Getter (berechnet bei Zugriff)
  get ORIGINS()  { return readConfig().origins.slice(); },
  get PREFIXES() { return readConfig().prefixes.slice(); },
  get ENFORCE()  { return readConfig().enforce; }
};
