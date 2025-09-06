# Tiptorro Live Quotes

Electron-App zur Anzeige von Live-Quoten-Seiten auf mehreren Monitoren in Tiptorro-Shops.  
➡️ Benutzerhandbuch: docs/USER_GUIDE.md

## Hauptfunktionen
- Erkennt alle angeschlossenen Displays/TVs
- „Bitte warten“-Screen mit Logo & Monitor-ID je Screen
- Zentrale UI nur auf dem Primärmonitor (Remote via TeamViewer)
- Autostart nach Windows-Neustart und Öffnen der gewünschten Live-Seiten pro Monitor
- Notausstieg via Esc oder Notaus-Button

## Entwicklung (kurz)
- Installation: 
pm install
- Entwicklung starten: 
pm run dev
- Build: 
pm run build

## Ordnerstruktur (kurz)
- Hauptdateien: main.js, preload.js, renderer.js
- Module: modules/
- Assets: assets/ (ttquotes.ico, TT.png, tt3.svg)
- Tests: tests/
- Builds/Installer: dist/
