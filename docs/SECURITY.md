# Security-Checkliste (Electron)

## Prozess-Isolation & WebPreferences
- [ ] Im **Hauptfenster**: 
odeIntegration: false
- [ ] contextIsolation: true
- [ ] sandbox: true
- [ ] enableRemoteModule: false
- [ ] webSecurity: true
- [ ] llowRunningInsecureContent: false
- [ ] spellcheck: false
- [ ] ackgroundThrottling: true (falls sinnvoll)
- [ ] disableBlinkFeatures nur wenn nötig

## Content Security Policy (CSP)
- [ ] Strikte CSP im Renderer/HTML setzen
- [ ] Nur erlaubte Domains für connect-src, img-src, rame-src
- [ ] Keine unsafe-inline/unsafe-eval (wenn möglich vermeiden)

## Navigation & Fenster
- [ ] setWindowOpenHandler blockt Popups; externe Links via shell.openExternal
- [ ] webContents.on('will-navigate', ...) nur Allowlist-Domains
- [ ] webContents.setWindowOpenHandler nutzt Allowlist

## Ressourcen & URLs
- [ ] **Allowlist** der Live-Quoten-Domains zentral verwalten
- [ ] Keine hart codierten Secrets/API-Keys
- [ ] .env/Secrets nicht im Repo (siehe .gitignore)

## Updates & Signierung
- [ ] Auto-Update mit Signaturprüfung (electron-updater)
- [ ] Windows Code-Signing Zertifikat (SmartScreen)
- [ ] Hash/Signatur der Installer dokumentieren

## Fehlerbehandlung & Logging
- [ ] uncaughtException/unhandledRejection Handler
- [ ] zentrales Logging (z. B. electron-log) mit Rotation
- [ ] Log-Export-Knopf in der UI

## Multi-Monitor & Kiosk
- [ ] screen.getAllDisplays() Mapping persistent speichern
- [ ] Fallback bei Display-Änderungen
- [ ] Escape/Notaus funktioniert jederzeit
- [ ] Kiosk/Fullscreen-Härtung (kein Kontextmenü, keine DevTools)

## Datenschutz
- [ ] Keine personenbezogenen Daten loggen
- [ ] Analytics nur aggregiert/opt-in

## Build & Supply Chain
- [ ] Lockfile committet (package-lock.json)
- [ ] 
pm audit/
px electron-builder install-app-deps regelmäßig
- [ ] Abhängigkeiten pinnen/prüfen
