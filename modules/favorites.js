// modules/favorites.js
const fs = require('fs');
const utils = require('./utils'); // <-- Das neue Hilfsmodul nutzen
const logger = require('./logger');
function loadFavorites(app) {
  const favoritesPath = utils.getUserDataPath(app, 'favorites.json');
  try {
    if (fs.existsSync(favoritesPath)) {
      const data = fs.readFileSync(favoritesPath, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
  logger.logError('Fehler beim Laden der Favoriten', err);
  return [];
}
}

function saveFavorites(app, favorites) {
  const favoritesPath = utils.getUserDataPath(app, 'favorites.json');
  try {
    fs.writeFileSync(favoritesPath, JSON.stringify(favorites, null, 2), 'utf-8');
  } catch (err) {
  logger.logError('Fehler beim Speichern der Favoriten', err);
}
}

module.exports = { loadFavorites, saveFavorites };
