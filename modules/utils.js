// modules/utils.js

const path = require('path');

// Liefert den Pfad zu einer Datei im userData-Ordner deiner App
function getUserDataPath(app, filename) {
  return path.join(app.getPath('userData'), filename);
}

// Prüft, ob eine URL ein gültiger HTTP(s)-Link ist
function isHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//.test(url);
}

// Sleep/Hilfsfunktion für Wartezeiten (Promise-basiert)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Plattform-Weichen für Windows/Mac/Linux
function isWindows() {
  return process.platform === 'win32';
}

function isMac() {
  return process.platform === 'darwin';
}

// Erweiterbar: Hier gern weitere kleine Hilfsfunktionen!

module.exports = {
  getUserDataPath,
  isHttpUrl,
  sleep,
  isWindows,
  isMac
};
