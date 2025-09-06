# OPERATIONS – Tiptorro Live Quotes

Dieses Dokument beschreibt Installation, Betrieb, Support und Troubleshooting.

## 1) Systemvoraussetzungen
- Windows 10 oder 11 (64-bit)
- TeamViewer-Zugang für den Support
- Internetzugang zu den Live-Quoten-Domains (Allowlist/Firewall entsprechend konfigurieren)
- Kein zusätzlicher WebView erforderlich (Electron-Bundle)

## 2) Installation (Shop-PC)
1. Installer (EXE) bereitstellen (lokal von \dist/\ oder später über GitHub Releases).
2. Doppelklick → Assistent folgen.
3. Nach Abschluss startet die App und zeigt auf **allen Displays** den „Bitte warten“-Screen (Logo + Monitor-ID).
4. Auf dem **Primärmonitor** erscheint die **Steuer-UI** (Konfiguration).

## 3) Remote-Konfiguration (TeamViewer)
1. Support verbindet sich via TeamViewer.
2. In der UI auf dem Primärmonitor für **jedes Display** die gewünschte Live-Quoten-Seite wählen.
3. Übernehmen/Speichern → die jeweiligen Monitore öffnen die Seiten.
4. **Notaus**: jederzeit **Esc** oder Notaus-Button → schließt Live-Seiten/Fenster.

## 4) Autostart nach Windows-Neustart
- Die App ist so konzipiert, dass sie nach Neustart automatisch startet.
- Falls auf einem PC **kein** Autostart aktiv ist, einfache Alternative:
  - **Win+R** → \shell:startup\ → Verknüpfung zur App anlegen.
- (Optional, IT-Team): Taskplaner nutzen oder per Installer/NSIS konfigurieren.

## 5) Speicherorte & Daten
- **Konfiguration (Mapping Display → URL)**: im Anwendungsdatenordner (Electron \pp.getPath("userData")\).
  - **Standardpfad (Windows)**: \%APPDATA%\\Tiptorro Live Quotes\ (genauen Ordnernamen der Installation entnehmen).
- **Logs** (empfohlen: electron-log): \%APPDATA%\\Tiptorro Live Quotes\\logs\\*.log\
- **Assets** (Runtime, z. B. Splash-Bilder): im App-Ressourcenordner (bei installiertem Build: \<Installationspfad>\\resources\\assets\)

## 6) Update-Strategie
- Aktuell: **manuelles Update** (neuen Installer ausführen, bestehende Installation überschreiben).
- Geplant: **Auto-Updater** (electron-updater) mit GitHub Releases.
- Code-Signierung für Windows empfohlen (SmartScreen).

## 7) Troubleshooting (Quick-Checks)
- **Schwarzer Bildschirm / Seite lädt nicht**:
  - Netzwerk/Firewall prüfen (Ziel-Domains erreichbar?)
  - Seite neu laden (UI-Aktion) oder Fenster schließen und neu zuweisen.
- **Anzeige falsch zugeordnet**:
  - Monitoreinstellungen in Windows prüfen (Primärmonitor korrekt?)
  - In der UI Mapping neu setzen und speichern.
- **Kein Autostart**:
  - Startup-Ordner prüfen (\shell:startup\) oder Taskplaner.
- **App hängt/Crash**:
  - App neu starten; Logs exportieren und an Support geben.
- **Komplett zurücksetzen**:
  - App beenden → Ordner \%APPDATA%\\Tiptorro Live Quotes\ sichern/löschen → App starten → neu konfigurieren.

## 8) Sicherheit (Betrieb)
- Nur erlaubte Ziel-Domains (Allowlist) verwenden.
- Keine sensiblen Daten in Logs.
- Regelmäßige Updates installieren.

## 9) Support-Checkliste (bei Störungen anfordern)
- App-Version (aus UI)
- Windows-Version
- Anzahl & Auflösung der Monitore (welcher ist Primär?)
- Gewünschte Seiten je Display
- Zeitpunkt/Schritte bis zum Fehler
- Zip der **logs/** und (falls freigegeben) Konfiguration

---
*Hinweis:* Technische Details zur Architektur siehe **docs/ARCHITECTURE.md**; Security-Prüfpunkte siehe **docs/SECURITY.md**.
