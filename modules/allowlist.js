// modules/allowlist.js

// Welche URLs sind erlaubt?
//  - alles unter https://shop.tiptorro.com
//  - Google Slides: https://docs.google.com/presentation...
const PREFIXES = [
  'https://shop.tiptorro.com',
  'https://docs.google.com/presentation'
];

// Zusätzlich erlaubte Origins (Protokoll + Host)
const ORIGINS = [
  'https://shop.tiptorro.com',
  'https://docs.google.com'
];

// Durchsetzung aktiv?
let enforce = true;

/**
 * Prüft, ob eine gegebene URL erlaubt ist.
 * Erlaubt, wenn sie mit einem der PREFIXES startet oder der Origin whitelisted ist.
 */
function isAllowedUrl(raw) {
  try {
    if (typeof raw !== 'string' || raw.length === 0) return false;

    // Prefix-Match zuerst (schnell und präzise)
    if (PREFIXES.some(p => raw.startsWith(p))) return true;

    // Fallback: Origin prüfen
    const u = new URL(raw);
    const origin = `${u.protocol}//${u.host}`;
    if (ORIGINS.includes(origin)) return true;

    return false;
  } catch {
    return false;
  }
}

/** Liefert den aktuellen Status für die UI/IPC */
function getStatus() {
  return {
    enforce,
    prefixes: [...PREFIXES],
    origins:  [...ORIGINS]
  };
}

/** Prüft, ob die Allowlist-Durchsetzung aktiv ist */
function isEnforced() {
  return enforce;
}

/** Enforce-Flag umschalten (falls später per UI benötigt) */
function setEnforce(v) {
  enforce = !!v;
}

module.exports = {
  isAllowedUrl,
  isEnforced,
  getStatus,
  setEnforce,
  PREFIXES,
  ORIGINS,
  get enforce() { return enforce; }
};
