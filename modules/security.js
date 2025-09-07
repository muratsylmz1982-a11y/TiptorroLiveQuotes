const { shell } = require('electron');
const allowlist = require('./allowlist');

function hardenWebContents(wc) {
  // In-Page Navigationen im Fenster absichern
  wc.on('will-navigate', (event, url) => {
    if (!allowlist.isAllowedUrl(url) && allowlist.isEnforced()) {
      event.preventDefault();
      try { shell.openExternal(url); } catch {}
    }
  });

  // Popups / target=_blank
  wc.setWindowOpenHandler(({ url }) => {
    if (allowlist.isAllowedUrl(url)) return { action: 'allow' };
    try { shell.openExternal(url); } catch {}
    return { action: 'deny' };
  });

  // kleine Härtung
  wc.on('dom-ready', () => {
    try { wc.executeJavaScript('try{window.eval=undefined}catch(e){}'); } catch {}
  });
}

function hardenSession(sess) {
  // Standardmäßig keine Sonderrechte erteilen
  sess.setPermissionRequestHandler((_wc, _permission, cb) => cb(false));

  // HTTP/HTTPS-Requests global filtern (greift auch bei loadURL)
  try {
    sess.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*'] },
      (details, callback) => {
        const url = details.url;
        if (allowlist.isAllowedUrl(url)) return callback({ cancel: false });

        if (allowlist.isEnforced()) {
          try { console.warn('[allowlist][block]', url); } catch {}
          return callback({ cancel: true });
        }
        try { console.warn('[allowlist][monitor]', url, 'nicht erlaubt (Config)'); } catch {}
        return callback({ cancel: false });
      }
    );
  } catch {}
}

module.exports = { hardenWebContents, hardenSession };
