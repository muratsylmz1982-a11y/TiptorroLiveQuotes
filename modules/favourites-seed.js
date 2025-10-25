const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function atomicWrite(p, data) {
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, p);
}

function findFirstExisting(paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

// Defaults: suche nacheinander favourites.json, favorites.json, favourite.json
function getDefaultsFavPath() {
  const defaultsRoot = app.isPackaged
    ? path.join(process.resourcesPath, 'defaults')   // packaged
    : path.join(app.getAppPath(), 'defaults');       // dev

  const candidates = ['favourites.json', 'favorites.json', 'favourite.json']
    .map(n => path.join(defaultsRoot, n));

  const found = findFirstExisting(candidates);
  if (!found) {
    logger.logWarning('[FAV-SEED] no defaults found in', defaultsRoot, '(looked for favourites.json, favorites.json, favourite.json)');
    return null;
  }
  logger.logInfo('[FAV-SEED] using defaults file:', path.basename(found));
  return found;
}

// User-Datei: bevorzugt US (favorites.json), fallback UK (favourites.json)
function getUserFavPaths() {
  const dir = app.getPath('userData');
  return {
    us: path.join(dir, 'favorites.json'),
    uk: path.join(dir, 'favourites.json'),
  };
}

function resolveUserFavPath() {
  const { us, uk } = getUserFavPaths();
  if (fs.existsSync(us)) return us;
  if (fs.existsSync(uk)) return uk;
  return us; // neue Installationen → US-Schreibweise
}

/**
 * Seed beim ersten Start.
 * mode: 'copy'  → nur schreiben, wenn user-Datei fehlt/leer
 *       'merge' → defaults in bestehende einfügen (Duplikate über key vermeiden)
 * key: eindeutiges Feld (z.B. 'url' oder 'id')
 */
async function seedFavourites({ mode = 'copy', key = 'url' } = {}) {
  const defPath = getDefaultsFavPath();
  if (!defPath) { return; }

  const userResolved = resolveUserFavPath();
  const { us: userUS, uk: userUK } = getUserFavPaths();

  logger.logInfo('[FAV-SEED] defaults path:', defPath);
  logger.logInfo('[FAV-SEED] user path (resolved):', userResolved);

  const defaults = readJsonSafe(defPath);
  if (!Array.isArray(defaults)) {
    logger.logWarning('[FAV-SEED] defaults invalid JSON/array — skip');
    return;
  }

  // aktuelle Userliste lesen (US bevorzugt, sonst UK)
  let current = readJsonSafe(userUS);
  if (!Array.isArray(current)) current = readJsonSafe(userUK);
  if (!Array.isArray(current)) current = null;

  if (mode === 'copy') {
    if (!Array.isArray(current) || current.length === 0) {
      atomicWrite(userResolved, defaults);
      logger.logSuccess('[FAV-SEED] wrote copy →', path.basename(userResolved));
    } else {
      logger.logInfo('[FAV-SEED] user already has favourites — skip copy');
    }
    return;
  }

  if (mode === 'merge') {
    const base = Array.isArray(current) ? current : [];
    const seen = new Set(base.map(x => x?.[key]));
    const merged = base.slice();
    for (const item of defaults) {
      const k = item?.[key];
      if (k != null && !seen.has(k)) { seen.add(k); merged.push(item); }
    }
    atomicWrite(userResolved, merged);
    logger.logSuccess('[FAV-SEED] wrote merge →', path.basename(userResolved));
  }
}

module.exports = {
  seedFavourites,
  getDefaultsFavPath,
  getUserFavPaths,
  resolveUserFavPath,
};
