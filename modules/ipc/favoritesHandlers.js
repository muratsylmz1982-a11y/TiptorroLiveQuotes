// modules/ipc/favoritesHandlers.js
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
    console.error('[FAVORITES] Plattform nicht unterstützt:', process.platform);
    return;
}

// Path-Traversal Schutz
if (!favoritesPath.startsWith(app.getPath('userData'))) {
    console.error('[FAVORITES] Unsicherer Pfad blockiert:', favoritesPath);
    return;
}

console.log('[FAVORITES] Öffne Editor:', editorCommand, favoritesPath);

try {
    const editorProcess = spawn(editorCommand, [favoritesPath], { 
        detached: false, // WICHTIG: Nicht detached!
        stdio: 'ignore'
    });
    
    editorProcess.on('error', (err) => {
        console.error('[FAVORITES] Editor-Fehler:', err.message);
    });
    
    editorProcess.on('exit', (code) => {
        console.log('[FAVORITES] Editor beendet mit Code:', code);
    });
    
} catch (error) {
    console.error('[FAVORITES] Fehler beim Editor-Start:', error.message);
}
  });
};
