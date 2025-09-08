# Architektur – Tiptorro Live Quotes

## Prozesse
- **Main-Prozess (Electron)**: Fenster-/Monitorverwaltung, Lebenszyklus, Autostart, Updates, Logging, IPC.
- **Renderer**: UI auf Primärmonitor (Konfiguration) + Inhaltsfenster je Display (Live-Seiten, Wartebildschirm).
- **Preload**: sichere Brücke (IPC) zwischen Renderer und Main, keine Node-APIs im Renderer.

## Haupt-Module (Auszug)
- modules/WindowManager.js – erstellt/verwaltet BrowserWindows (Primär-UI + pro Display), Kiosk/Fullscreen, Notausstieg.
- modules/DisplayService.js & modules/displays.js – Erkennung screen.getAllDisplays(), Events display-added/removed, Mapping Display→URL.
- modules/RefreshManager.js (+ efreshManagerSingleton.js) – geplante Reloads/Refreshraten.
- modules/PerformanceMonitor.js – Metriken/Watchdog (Seiten-Timeouts etc.).
- modules/AnalyticsManager.js – optionale Nutzungs-/Statusdaten (aggregiert).
- modules/ExtendedConfig.js & modules/config.js – Konfiguration (Persistenz), Favoriten/Allowlist.
- modules/favorites.js – Schnellzugriff auf häufige Live-Seiten.
- modules/wartebildschirme.js – „Bitte warten“-Screens je Monitor (Logo + ID).
- modules/updateManager.js – Auto-Update (electron-updater, später aktivieren).
- modules/logger.js – Zentrales Logging (Rotation), Export.
- modules/ipc/*Handlers.js – IPC-Endpunkte (z. B. Displays/Favoriten).
- modules/utils.js – Hilfsfunktionen (Pfade, Fehlerbehandlung etc.).

## Datenflüsse (vereinfacht)
1. **App-Start (Main)** → liest Konfiguration → ermittelt Displays → erzeugt Primär-UI + Wartebildschirmfenster je Display.
2. **Support/Bedienung (Renderer-UI)** → Auswahl pro Display (URL/Favorit) → IPC an Main → Fenster pro Display lädt Zielseite.
3. **Persistenz** → Mapping Display-ID→URL speichern (z. B. JSON/electron-store) → beim nächsten Start automatisch wiederherstellen.
4. **Health/Recovery** → Performance/Timeouts überwachen → bei Fehlern Reload/Fallback auf Wartebildschirm.

## Sicherheit (Kurz)
- Fenster mit contextIsolation: true, 
odeIntegration: false, sandbox: true.
- **CSP** & **URL-Allowlist**: Nur erlaubte Domains für rame-src/connect-src/img-src.
- setWindowOpenHandler & will-navigate → nur Allowlist, externe Links via shell.openExternal.

## Build/Distribution
- **Build**: 
pm run build (electron-builder) → Artefakte in dist/.
- **Ressourcen**: ssets/ (Icons/Bilder) zur Laufzeit via process.resourcesPath laden.
- **Autostart**: Installer/NSIS oder App-Option (geplant).
- **Releases**: GitHub Releases (später Auto-Update).

## Offene TODOs
- [ ] CSP in HTMLs ergänzen.
- [ ] Zentrale Domain-Allowlist.
- [ ] Crash-/Error-Handler vereinheitlichen.
- [ ] Log-Export in UI.
- [ ] README für Entwickler (Build/Debug/Signierung).
