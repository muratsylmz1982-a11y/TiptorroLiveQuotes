const { shell } = require('electron');
const { isAllowedUrl } = require('./allowlist');

function hardenWebContents(wc) {
  // Blockt Navigations zu nicht erlaubten Zielen (öffnet sie extern)
  wc.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  // Neue Fenster/Popups nur erlauben, wenn Domain auf Allowlist steht
  wc.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) return { action: 'allow' };
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  // Hardening (kleine Zusatzmaßnahme)
  wc.on('dom-ready', () => {
    wc.executeJavaScript('try{window.eval=undefined}catch(e){}').catch(() => {});
  });
}

function hardenSession(sess) {
  // Standardmäßig alle Berechtigungen verweigern (Mikrofon, Kamera, etc.)
  sess.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });
}

module.exports = { hardenWebContents, hardenSession };
