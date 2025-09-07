const { shell } = require('electron');
const { isAllowedUrl, ENFORCE } = require('./allowlist');

function hardenWebContents(wc) {
  // Blockt Navigations innerhalb des Fensters
  wc.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      if (ENFORCE) {
        event.preventDefault();
        try { shell.openExternal(url); } catch {}
      } else {
        // Monitor-Only: erlauben, aber Hinweis in Konsole (bereits in isAllowedUrl)
      }
    }
  });

  // Steuert Popups/target=_blank
  wc.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) return { action: 'allow' };
    try { shell.openExternal(url); } catch {}
    return { action: 'deny' };
  });

  // Kleine Zusatz-Härtung im Renderer
  wc.on('dom-ready', () => {
    try { wc.executeJavaScript('try{window.eval=undefined}catch(e){}'); } catch {}
  });
}

function hardenSession(sess) {
  // Standardmäßig keine Sonderberechtigungen
  sess.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

  // **Zuverlässiger Request-Filter** (greift auch bei loadURL)
  try {
    sess.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*'] },
      (details, callback) => {
        const url = details.url;
        if (isAllowedUrl(url)) return callback({ cancel: false });

        if (ENFORCE) {
          try { console.warn('[allowlist][block]', url); } catch {}
          return callback({ cancel: true });
        }
        try { console.warn('[allowlist][monitor]', url); } catch {}
        return callback({ cancel: false });
      }
    );
  } catch {}
}

module.exports = { hardenWebContents, hardenSession };
