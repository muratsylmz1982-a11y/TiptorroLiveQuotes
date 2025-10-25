# Security-Checkliste (Electron)

## Prozess-Isolation & WebPreferences
- [x] Im **Hauptfenster**: `nodeIntegration: false`
- [x] `contextIsolation: true`
- [ ] `sandbox: true` (teilweise implementiert)
- [x] `enableRemoteModule: false`
- [ ] `webSecurity: true` (sollte überprüft werden)
- [ ] `allowRunningInsecureContent: false`
- [ ] `spellcheck: false`
- [x] `backgroundThrottling: false` (bewusst deaktiviert für Monitor-Service)
- [ ] `disableBlinkFeatures` nur wenn nötig

## Content Security Policy (CSP)
- [x] Strikte CSP im Renderer/HTML setzen ✅ **v1.2.4**
- [x] Nur erlaubte Domains für `connect-src`, `img-src`, `frame-src` ✅ **v1.2.4**
- [x] `unsafe-eval` entfernt ✅ **v1.2.4**
- [x] `unsafe-inline` nur wo technisch notwendig (Inline-Styles)
- [x] `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` ✅ **v1.2.4**

## Navigation & Fenster
- [x] `setWindowOpenHandler` blockt Popups; externe Links via `shell.openExternal` ✅
- [x] `webContents.on('will-navigate', ...)` nur Allowlist-Domains ✅
- [x] `webContents.setWindowOpenHandler` nutzt Allowlist ✅

## Ressourcen & URLs
- [x] **Allowlist** der Live-Quoten-Domains zentral verwaltet (`modules/allowlist.js`) ✅
- [x] Keine hart codierten Secrets/API-Keys ✅
- [x] `.env`/Secrets nicht im Repo (siehe `.gitignore`) ✅

## Updates & Signierung
- [x] Auto-Update mit `electron-updater` vorbereitet (UpdateManager) ⚠️ **Nicht aktiviert**
- [ ] Windows Code-Signing Zertifikat (SmartScreen) ⚠️ **Ausstehend**
- [ ] Hash/Signatur der Installer dokumentieren ⚠️ **Ausstehend**

## Fehlerbehandlung & Logging
- [ ] `uncaughtException`/`unhandledRejection` Handler ⚠️ **Fehlt**
- [x] Zentrales Logging (winston) mit Rotation ✅ **v1.2.4**
- [ ] Log-Export-Knopf in der UI ⚠️ **Fehlt**

## Multi-Monitor & Kiosk
- [x] `screen.getAllDisplays()` Mapping persistent speichern ✅
- [x] Fallback bei Display-Änderungen (Monitor-Service) ✅
- [x] Escape/Notaus funktioniert jederzeit ✅
- [x] Kiosk/Fullscreen-Härtung (kein Kontextmenü) ✅
- [ ] DevTools deaktiviert in Production ⚠️ **Sollte geprüft werden**

## Datenschutz
- [x] Keine personenbezogenen Daten loggen ✅
- [x] Analytics nur aggregiert (AnalyticsManager) ✅

## Build & Supply Chain
- [x] Lockfile committet (`package-lock.json`) ✅
- [ ] `npm audit` regelmäßig ausführen ⚠️ **Empfohlen**
- [ ] `electron-builder install-app-deps` regelmäßig ⚠️ **Empfohlen**
- [ ] Abhängigkeiten pinnen/prüfen ⚠️ **Empfohlen**

---

## Zusammenfassung (Stand v1.2.4)

### ✅ Implementiert (19/34)
- Prozess-Isolation: 4/9
- CSP: 5/5 ✅ **Vollständig**
- Navigation & Fenster: 3/3 ✅ **Vollständig**
- Ressourcen & URLs: 3/3 ✅ **Vollständig**
- Updates: 1/3
- Logging: 1/3
- Multi-Monitor: 5/6
- Datenschutz: 2/2 ✅ **Vollständig**
- Build: 1/4

### ⚠️ Priorität Hoch
1. **Global Error Handler** für uncaughtException/unhandledRejection
2. **Code-Signing Zertifikat** besorgen
3. **DevTools** in Production deaktivieren
4. **Log-Export** in UI implementieren

### 📋 Mittlere Priorität
5. `sandbox: true` überall aktivieren
6. `webSecurity: true` explizit setzen
7. `npm audit` in CI/CD Pipeline
8. Dependency-Scanning automatisieren

### 💡 Niedrige Priorität
9. `spellcheck: false` setzen
10. Installer-Hashes dokumentieren
