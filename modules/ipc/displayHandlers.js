// modules/ipc/displayHandlers.js
module.exports = (app, ipcMain, screen) => {
  ipcMain.handle('get-displays', () => {
    return screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      label: `Anzeige ${i + 1} – ${d.bounds.width}x${d.bounds.height}`,
      index: i
    }));
  });
  // Hier können später noch weitere Display-IPC-Handler dazu!
};
