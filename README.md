# Tiptorro Live Quotes

Mehrmonitor-App (Electron) f�r Tiptorro Sportwetten: erkennt alle angeschlossenen TV/Monitore, zeigt Wartescreens mit Monitor-ID und l�dt nach Konfiguration die gew�nschten **Live-Quoten-Seiten**. Remote-Konfiguration via **TeamViewer** �ber die UI am Prim�rmonitor.

![Status](https://img.shields.io/github/actions/workflow/status/muratsylmz1982-a11y/TiptorroLiveQuotes/ci.yml?branch=main)
![Release](https://img.shields.io/github/v/release/muratsylmz1982-a11y/TiptorroLiveQuotes)  
Aktuelles Release: **v1.2.3**

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
- **Remote-Setup** via TeamViewer �ber Prim�r-UI (Favoriten + URL je Display)
- **Monitor-Hotplug (ab v1.2.2):**
  - **Zur Laufzeit:** F�llt ein Monitor (HDMI/TV/Defekt) aus, wird die dort laufende Live-Seite **geparkt** (unsichtbar, l�uft weiter) � **kein Fallback auf Prim�r**.
  - **Wiederanschluss:** Seite wird **automatisch** auf genau diesem Monitor **fortgesetzt**.
  - **Neustart:** Beim App/PC-Neustart wird **nicht** automatisch geparkt (Prim�r bleibt normal).
- **Autostart** nach Windows-Neustart (Option)
- **Notausstieg**: *Esc* oder **Beenden**-Button
- **Refresh-Manager** (koordinierte Reloads; Default: **30 Min.** & Overlay **3,5 s** � in Erweiterten Einstellungen �nderbar)
- Vorbereitete Sicherheitsmechanismen: **Allowlist & CSP**

## Systemvoraussetzungen
- Windows 10/11 (64-bit)
- Internetzugang zu den Live-Quoten-Domains
- TeamViewer-Zugang f�r Support

## Installation (Shops)
1. Neuestes Release herunterladen:  
   ? **Releases:** https://github.com/muratsylmz1982-a11y/TiptorroLiveQuotes/releases
2. `TTQuotes Setup x.y.z.exe` ausf�hren und dem Assistent folgen.  
   (Alternative: **Portable** `dist/win-unpacked/TTQuotes.exe`)
3. App startet ? auf allen Displays Wartescreens, **Prim�rmonitor** zeigt die Steuer-UI.

## Bedienung (Kurz)
- Pro TV/Monitor **Favorit w�hlen** oder **URL** eintragen, **Vorschau** pr�fen.
- **LIVE-VIEWS STARTEN** ? Zielseiten �ffnen sich auf den TVs.
- **Autostart** optional aktivieren (Button links unten).
- **Esc** oder **Beenden** schlie�t alle Live-Seiten/Fenster.

## Troubleshooting
- Seite l�dt nicht ? Netzwerk/Firewall & Ziel-Domain pr�fen, **Vorschau** neu laden.
- Monitor-Zuordnung falsch ? Windows-Anzeigeeinstellungen pr�fen, Mapping neu speichern.
- Kein Autostart ? `shell:startup` Verkn�pfung oder per Option aktivieren.
- Vollst�ndiger Reset ? App beenden, `%APPDATA%\Tiptorro Live Quotes\` sichern/l�schen, App neu starten.

## Development/Build
```bash
npm ci
npm start         # Dev-Start
npm test          # Jest-Tests
npm run dist-win  # Windows-Installer bauen (electron-builder)

Dokumentation

Benutzerhandbuch: docs/user_guide.md

Betrieb/Support: docs/operations.md

Architektur: docs/architecture.md

Security: docs/security.md

Sicherheit (Kurz)

Renderer: contextIsolation: true, nodeIntegration: false (Preload als einzige Bridge)

Allowlist-/Hardening-Hooks aktiv (Navigation/Popups), safeLoadUrl(...) f�r externe Loads

CSP gesetzt; Ressourcen auf definierte Domains beschr�nkt

Changelog

Siehe CHANGELOG.md.
