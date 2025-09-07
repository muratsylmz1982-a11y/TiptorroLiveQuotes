# Tiptorro Live Quotes

Mehrmonitor-App (Electron) für Tiptorro Sportwetten: erkennt alle angeschlossenen TV/Monitore, zeigt Wartescreens mit Monitor-ID und lädt nach Konfiguration die gewünschten **Live-Quoten-Seiten**. Remote-Konfiguration via **TeamViewer** über die UI am Primärmonitor.

![Status](https://img.shields.io/github/actions/workflow/status/muratsylmz1982-a11y/TiptorroLiveQuotes/ci.yml?branch=main)
![Release](https://img.shields.io/github/v/release/muratsylmz1982-a11y/TiptorroLiveQuotes)  
Aktuelles Release: **v1.2.0**

---

## Inhalte
- [Features](#features)
- [Systemvoraussetzungen](#systemvoraussetzungen)
- [Installation (Shops)](#installation-shops)
- [Bedienung (Kurz)](#bedienung-kurz)
- [Troubleshooting](#troubleshooting)
- [Development/Build](#developmentbuild)
- [Dokumentation](#dokumentation)
- [Sicherheit (Kurz)](#sicherheit-kurz)
- [Changelog](#changelog)

## Features
- Automatische **Display-Erkennung** & Zuordnung
- **Wartescreen** je Monitor (Logo + ID)
- **Remote-Setup** via TeamViewer über Primär-UI (Favoriten + URL je Display)
- **Autostart** nach Windows-Neustart (Option)
- **Notausstieg**: *Esc* oder **Beenden**-Button
- Refresh-Manager, Performance-Dashboard (optional)
- Vorbereitete Sicherheitsmechanismen: **Allowlist & CSP**

## Systemvoraussetzungen
- Windows 10/11 (64-bit)
- Internetzugang zu den Live-Quoten-Domains
- TeamViewer-Zugang für Support

## Installation (Shops)
1. Neuestes Release herunterladen:  
   → **Releases:** https://github.com/muratsylmz1982-a11y/TiptorroLiveQuotes/releases
2. TTQuotes Setup x.y.z.exe ausführen und dem Assistent folgen.  
   (Alternative: **Portable** dist/win-unpacked/TTQuotes.exe)
3. App startet → auf allen Displays Wartescreens, **Primärmonitor** zeigt die Steuer-UI.

## Bedienung (Kurz)
- Pro TV/Monitor **Favorit wählen** oder **URL** eintragen, **Vorschau** prüfen.
- **LIVE-VIEWS STARTEN** → Zielseiten öffnen sich auf den TVs.
- **Autostart** optional aktivieren (Button links unten).
- **Esc** oder **Beenden** schließt alle Live-Seiten/Fenster.

## Troubleshooting
- Seite lädt nicht → Netzwerk/Firewall & Ziel-Domain prüfen, **Vorschau** neu laden.
- Monitor-Zuordnung falsch → Windows-Anzeigeeinstellungen prüfen, Mapping neu speichern.
- Kein Autostart → shell:startup Verknüpfung oder per Option aktivieren.
- Vollständiger Reset → App beenden, %APPDATA%\Tiptorro Live Quotes\ sichern/löschen, App neu starten.

Mehr Details: siehe **docs/OPERATIONS.md**.

## Development/Build
`ash
npm ci
npm start      # Dev-Start
npm test       # Jest-Tests
npm run build  # electron-builder (Dist/Installer)
Dokumentation

Benutzerhandbuch: docs/USER_GUIDE.md

Betrieb/Support: docs/OPERATIONS.md

Architektur: docs/ARCHITECTURE.md

Security-Checkliste: docs/SECURITY.md

Sicherheit (Kurz)

Renderer mit contextIsolation: true, nodeIntegration: false

Allowlist-/Hardening-Hooks vorhanden (aktuell Monitor-Only, kein Blocking)

CSP eingetragen (permissiv; wird später geschärft)

Changelog
v1.2.0

Fix: Umlaute/Encoding stabilisiert (Start/Settings/Dashboard)

Docs: README, ARCHITECTURE, OPERATIONS, SECURITY ergänzt

CI: GitHub Actions (npm ci + npm test)

Security: Allowlist + Hardening-Hooks (monitor-only), BrowserWindow-Flags

© Tiptorro Sportwetten – Alle Rechte vorbehalten.
