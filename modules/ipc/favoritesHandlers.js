// modules/ipc/favoritesHandlers.js
const logger = require('../logger');

module.exports = (app, ipcMain, favorites) => {
  ipcMain.handle('get-favorites', () => favorites.loadFavorites(app));
  ipcMain.handle('save-favorites', (event, favs) => favorites.saveFavorites(app, favs));
  ipcMain.on('edit-favorites', () => {
    let favs = favorites.loadFavorites(app);
    if (!Array.isArray(favs) || favs.length === 0) {
      favs = [
        { name: 'Werbelink', url: 'https://...' },
        { name: 'Beispielseite', url: 'https://example.com' }
      ];
      favorites.saveFavorites(app, favs);
    }
    const path = require('path');
    const { spawn } = require('child_process');
    // Sichere Process-Verwaltung
const allowedEditors = {
    'win32': 'notepad.exe',
    'darwin': 'open',
    'linux': 'xdg-open'
};

const editorCommand = allowedEditors[process.platform];
if (!editorCommand) {
    logger.logError('[FAVORITES] Plattform nicht unterstützt:', process.platform);
    return;
}

// Path-Traversal Schutz
if (!favoritesPath.startsWith(app.getPath('userData'))) {
    logger.logError('[FAVORITES] Unsicherer Pfad blockiert:', favoritesPath);
    return;
}

logger.logInfo('[FAVORITES] Öffne Editor:', editorCommand, favoritesPath);

try {
    const editorProcess = spawn(editorCommand, [favoritesPath], { 
        detached: false, // WICHTIG: Nicht detached!
        stdio: 'ignore'
    });
    
    editorProcess.on('error', (err) => {
        logger.logError('[FAVORITES] Editor-Fehler:', err.message);
    });
    
    editorProcess.on('exit', (code) => {
        logger.logInfo('[FAVORITES] Editor beendet mit Code:', code);
    });
    
} catch (error) {
    logger.logError('[FAVORITES] Fehler beim Editor-Start:', error.message);
}
  });
};
