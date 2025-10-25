# Tiptorro Live Quotes - Benutzerhandbuch

![Tiptorro Logo](assets/tiptorro-logo.png)

**Version:** 2.0  
**Datum:** August 2025  
**Für:** Windows-Endbenutzer  

---

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Systemvoraussetzungen](#systemvoraussetzungen)
3. [Download & Installation](#download--installation)
4. [Erststart & Konfiguration](#erststart--konfiguration)
5. [Tägliche Bedienung](#tägliche-bedienung)
6. [Multi-Monitor-Setup](#multi-monitor-setup)
7. [Fehlerbehebung](#fehlerbehebung)
8. [Support & Kontakt](#support--kontakt)
9. [Kurzanleitung (One-Pager)](#kurzanleitung-one-pager)

---

## Überblick

**Tiptorro Live Quotes** ist eine professionelle Multi-Monitor-Anwendung für die Darstellung von Live-Inhalten auf mehreren Bildschirmen gleichzeitig. Die Software eignet sich ideal für:

- **Digital Signage** in Einzelhandel und Gastronomie
- **Live-Sport-Displays** mit aktuellen Ergebnissen
- **Informationsanzeigen** in Büros und öffentlichen Bereichen
- **Kiosk-Systeme** mit automatischer Aktualisierung

### Hauptfunktionen

- ✅ **Multi-Monitor-Unterstützung** (bis zu 10+ Bildschirme)
- ✅ **Automatische Inhalts-Aktualisierung** mit konfigurierbaren Intervallen
- ✅ **Hotplug-Support** für dynamisches An-/Abstecken von Monitoren
- ✅ **Kiosk-Modus** für störungsfreie Vollbild-Darstellung
- ✅ **Favoriten-System** für häufig verwendete Inhalte
- ✅ **Performance-Monitoring** mit Live-Dashboard
- ✅ **Automatische Updates** für neue Features und Bugfixes

---

## Systemvoraussetzungen

### Mindestanforderungen

| Komponente | Mindestanforderung | Empfohlen |
|------------|-------------------|-----------|
| **Betriebssystem** | Windows 10 (64-bit) | Windows 11 |
| **Prozessor** | Intel i3 / AMD Ryzen 3 | Intel i5 / AMD Ryzen 5 |
| **Arbeitsspeicher** | 4 GB RAM | 8 GB RAM |
| **Grafikkarte** | DirectX 11 kompatibel | Dedizierte GPU |
| **Festplatte** | 500 MB freier Speicher | 2 GB freier Speicher |
| **Monitore** | 1 Monitor | 2-6 Monitore |
| **Internet** | Breitband (für Updates) | Breitband (für Live-Inhalte) |

### Unterstützte Windows-Versionen

- ✅ **Windows 10** (Version 1903 oder neuer)
- ✅ **Windows 11** (alle Versionen)
- ❌ Windows 8.1 oder älter (nicht unterstützt)

### Berechtigungen

- **Standard-Benutzer:** Ausreichend für normale Nutzung
- **Administrator:** Nur für Installation erforderlich
- **Netzwerk:** Ausgehende HTTPS-Verbindungen (Port 443)
- **Firewall:** Keine eingehenden Verbindungen erforderlich

---

## Download & Installation

### Schritt 1: Download

1. **Offizielle Download-Quelle:**
   ```
   https://download.tiptorro.com/live-quotes/latest
   ```

2. **Datei-Details:**
   - **Dateiname:** `Tiptorro-Live-Quotes-Setup-2.0.exe`
   - **Größe:** ~150 MB
   - **Publisher:** Tiptorro Technologies GmbH
   - **SHA-256:** `a1b2c3d4e5f6...` (wird auf Download-Seite angezeigt)

3. **Integrität prüfen (optional):**
   ```bash
   certutil -hashfile "Tiptorro-Live-Quotes-Setup-2.0.exe" SHA256
   ```

### Schritt 2: Windows SmartScreen

![SmartScreen Warnung](assets/screens/smartscreen-warning.png)

**Falls Windows SmartScreen eine Warnung anzeigt:**

1. Klicken Sie auf **"Weitere Informationen"**
2. Klicken Sie auf **"Trotzdem ausführen"**
3. **Grund:** Neue Software-Signatur, vollkommen sicher

### Schritt 3: Installation

![Installations-Wizard](assets/screens/install-wizard.png)

1. **Setup starten:**
   - Doppelklick auf `Tiptorro-Live-Quotes-Setup-2.0.exe`
   - **UAC-Prompt:** Klicken Sie **"Ja"** (Administrator-Rechte)

2. **Willkommens-Bildschirm:**
   - Klicken Sie **"Weiter"**

3. **Lizenzvereinbarung:**
   - Wählen Sie **"Ich akzeptiere die Vereinbarung"**
   - Klicken Sie **"Weiter"**

4. **Installationsort wählen:**
   ```
   Standard: C:\Program Files\Tiptorro Live Quotes\
   ```
   - **Empfehlung:** Standard-Pfad beibehalten
   - Klicken Sie **"Weiter"**

5. **Start-Menü-Ordner:**
   - Standard: **"Tiptorro"**
   - Klicken Sie **"Weiter"**

6. **Zusätzliche Aufgaben:**
   - ☑️ **Desktop-Verknüpfung erstellen**
   - ☑️ **Beim Windows-Start automatisch starten** (empfohlen)
   - Klicken Sie **"Weiter"**

7. **Installation:**
   - Klicken Sie **"Installieren"**
   - **Dauer:** 2-5 Minuten
   - **Fortschritt:** Wird in Echtzeit angezeigt

8. **Fertigstellung:**
   - ☑️ **Tiptorro Live Quotes jetzt starten**
   - Klicken Sie **"Fertigstellen"**

### Erwartetes Ergebnis

Nach erfolgreicher Installation finden Sie:

- **Desktop-Symbol:** ![Desktop Icon](assets/icons/desktop-icon.png) Tiptorro Live Quotes
- **Start-Menü:** Start → Alle Programme → Tiptorro → Live Quotes
- **Installationsordner:** `C:\Program Files\Tiptorro Live Quotes\`
- **Benutzer-Daten:** `C:\Users\[Ihr Name]\AppData\Roaming\Tiptorro Live Quotes\`

**✅ Installations-Checkliste:**
- [ ] Download abgeschlossen (150 MB)
- [ ] SmartScreen-Warnung akzeptiert
- [ ] Installation ohne Fehler durchgelaufen
- [ ] Desktop-Symbol vorhanden
- [ ] Erste Start erfolgreich

---

## Erststart & Konfiguration

### Erster Programmstart

![Erstes Laden](assets/screens/first-launch.png)

1. **Anwendung starten:**
   - Doppelklick auf Desktop-Symbol **ODER**
   - Start-Menü → Tiptorro → Live Quotes

2. **Erstes Laden:**
   - **Dauer:** 10-30 Sekunden
   - **Anzeige:** Tiptorro-Logo mit Ladebalken
   - **Hintergrund:** System erkennt verfügbare Monitore

3. **Monitor-Erkennung:**
   ```
   Erkannte Bildschirme: 2 TV-Geräte
   ├── TV-Gerät 1: 1920 × 1080 (Primary)
   └── TV-Gerät 2: 1920 × 1080 (Secondary)
   ```

### Haupt-Benutzeroberfläche

![Hauptfenster](assets/screens/main-interface.png)

Die Anwendung zeigt automatisch das **Live TV Config**-Fenster:

#### Bereiche der Oberfläche

1. **Header (oben):**
   - 🟢 **System Online** - Status-Indikator
   - **2 TV-Geräte erkannt** - Monitor-Anzahl

2. **Konfigurationsbereich (mitte):**
   - **TV-Gerät 1** (Primary Display)
   - **TV-Gerät 2** (Secondary Display)

3. **Button-Leiste (unten):**
   - **AUTO-START** - Automatisch beim Windows-Start
   - **LIVE-VIEWS STARTEN** - Hauptfunktion
   - **FAVORITEN BEARBEITEN** - URL-Verwaltung
   - **KONFIGURATION LÖSCHEN** - Reset
   - **BEENDEN** - Programm schließen
   - **ERWEITERTE EINSTELLUNGEN** - Performance & Updates

### Monitor-Konfiguration

![Monitor-Konfiguration](assets/screens/monitor-config.png)

**Für jeden erkannten Monitor:**

1. **Favorit auswählen:**
   - Klicken Sie auf **"— Favorit wählen —"**
   - Wählen Sie eine vordefinierte URL aus der Liste

2. **Oder manuelle URL eingeben:**
   ```
   Beispiele:
   https://shop.tiptorro.com/livescoretv
   https://docs.google.com/spreadsheets/d/[ID]
   https://beispiel.de/dashboard
   ```

3. **Vorschau testen:**
   - Klicken Sie **"VORSCHAU"**
   - **Ergebnis:** Fenster öffnet sich auf dem gewählten Monitor
   - **Schließen:** Klicken Sie irgendwo in das schwarze Fenster

### Erste Favoriten anlegen

![Favoriten bearbeiten](assets/screens/favorites-dialog.png)

1. **Favoriten-Dialog öffnen:**
   - Klicken Sie **"FAVORITEN BEARBEITEN"**

2. **Neuen Favorit hinzufügen:**
   - **Name:** `Live Sport` (Anzeigename)
   - **URL:** `https://shop.tiptorro.com/livescoretv`
   - Klicken Sie **"HINZUFÜGEN"**

3. **Weitere Beispiel-Favoriten:**
   
   | Name | URL | Verwendung |
   |------|-----|------------|
   | Ticker | https://shop.tiptorro.com/ticker | Nachrichten-Laufband |
   | Dashboard | https://docs.google.com/... | Google Sheets Dashboard |
   | Speisekarte | https://restaurant.de/menu | Digitale Speisekarte |
   | Wetter | https://weather.com/location | Wetter-Widget |

4. **Speichern:**
   - Klicken Sie **"SCHLIESSEN"**
   - **Ergebnis:** Favoriten stehen in der Auswahlliste zur Verfügung

**✅ Erstkonfiguration-Checkliste:**
- [ ] Anwendung startet ohne Fehler
- [ ] Alle Monitore werden erkannt
- [ ] Mindestens 1 Favorit angelegt
- [ ] Vorschau-Funktion getestet
- [ ] Konfiguration gespeichert

---

## Tägliche Bedienung

### Standard-Workflow: Live-Views starten

![Live-Views starten](assets/screens/start-live-views.png)

1. **Konfiguration prüfen:**
   - Jeder Monitor hat eine zugewiesene URL
   - Favoriten oder manuelle URLs sind korrekt

2. **Live-Views starten:**
   - Klicken Sie **"LIVE-VIEWS STARTEN"**
   - **Ergebnis:** Auf jedem Monitor öffnet sich sofort ein Vollbild-Fenster
   - **Dauer:** 2-5 Sekunden je nach Internetgeschwindigkeit

3. **Live-Betrieb:**
   ```
   ✅ Monitor 1: Zeigt https://shop.tiptorro.com/livescoretv
   ✅ Monitor 2: Zeigt https://docs.google.com/spreadsheets/...
   🔄 Auto-Refresh: Alle 60 Sekunden (konfigurierbar)
   ```

### Laufende Live-Views beenden

![Live-Views beenden](assets/screens/stop-live-views.png)

**Methode 1: Notaus-Hotspot**
- **Position:** Ganz links am Bildschirm-Rand (unsichtbarer Bereich, 16px breit)
- **Aktion:** Klicken Sie mit der Maus ganz links am Bildschirm-Rand
- **Ergebnis:** Alle Fenster schließen sofort, Haupt-Interface wird sichtbar

**Methode 2: Tastenkombination**
- **Tasten:** `Alt + F4` (auf einem Live-View-Fenster)
- **Ergebnis:** Nur das aktuelle Fenster schließt

**Methode 3: Haupt-Interface**
- **Weg:** Windows-Taskleiste → Tiptorro Live Quotes anklicken
- **Button:** "BEENDEN" → Bestätigen

### Autostart konfigurieren

![Autostart-Einstellung](assets/screens/autostart-config.png)

1. **Autostart aktivieren:**
   - Klicken Sie **"AUTO-START"**
   - **Status wechselt:** 🟢 Auto-Start aktiviert

2. **Verhalten bei Windows-Start:**
   ```
   1. Windows startet
   2. Tiptorro Live Quotes startet automatisch
   3. Lädt letzte Konfiguration
   4. Startet Live-Views nach 10 Sekunden Verzögerung
   ```

3. **Autostart deaktivieren:**
   - Klicken Sie erneut **"AUTO-START"**
   - **Status wechselt:** ⚪ Auto-Start deaktiviert

### Konfiguration zurücksetzen

![Konfiguration löschen](assets/screens/reset-config.png)

1. **Reset durchführen:**
   - Klicken Sie **"KONFIGURATION LÖSCHEN"**
   - **Warnung:** "Alle Monitor-Zuweisungen werden entfernt. Fortfahren?"
   - Klicken Sie **"JA"**

2. **Ergebnis nach Reset:**
   - Alle Monitor-URLs sind leer
   - Favoriten bleiben erhalten
   - Erweiterte Einstellungen bleiben erhalten
   - Autostart-Status bleibt erhalten

**✅ Tägliche Bedienung-Checkliste:**
- [ ] Live-Views erfolgreich gestartet
- [ ] Alle Monitore zeigen korrekte Inhalte
- [ ] Notaus-Funktion getestet
- [ ] Autostart nach Bedarf konfiguriert

---

## Multi-Monitor-Setup

### Monitor-Erkennung und Zuordnung

![Multi-Monitor-Erkennung](assets/screens/multi-monitor-detection.png)

**Automatische Erkennung:**
```
Tiptorro Live Quotes erkennt automatisch:
├── Anzahl der Monitore (bis zu 10+)
├── Auflösung pro Monitor (z.B. 1920×1080, 4K)
├── Position (Primary, Secondary, Extended)
└── DPI-Skalierung (100%, 125%, 150%)
```

**Monitor-Reihenfolge:**
- **TV-Gerät 1:** Immer der Haupt-Monitor (Primary Display)
- **TV-Gerät 2:** Zweiter Monitor in Windows-Einstellungen
- **TV-Gerät N:** Weitere Monitore in Windows-Reihenfolge

### Hot-Plug: Monitore während Betrieb an-/abstecken

![Hotplug-Erkennung](assets/screens/hotplug-detection.png)

**Monitor hinzufügen (Hot-Plug):**

1. **Monitor anschließen:**
   - HDMI/DisplayPort-Kabel einstecken
   - Monitor einschalten

2. **Automatische Erkennung:**
   ```
   [LOG] Neuer Monitor verfügbar - eventuell Konfiguration anpassen
   [LOG] Display-Anzahl: 2 → 3 Monitore
   ```

3. **Interface aktualisiert sich:**
   - **Neue Konfigurationskarte** für TV-Gerät 3 erscheint
   - **Automatisch:** Monitor wird erkannt und ist sofort konfigurierbar
   - **Status:** 🟢 "3 TV-Geräte erkannt"

**Monitor entfernen:**

1. **Monitor abstecken:**
   - Während Live-Views laufen

2. **Automatische Behandlung:**
   ```
   [LOG] Monitor entfernt - prüfe laufende Fenster
   [LOG] Fenster auf entferntem Monitor wird geschlossen
   [LOG] Display-Anzahl: 3 → 2 Monitore
   ```

3. **Interface-Anpassung:**
   - Konfigurationskarte für entfernten Monitor verschwindet
   - Laufende Live-Views auf verbleibendem Monitor weiterlaufen

### DPI-Skalierung und Auflösung

![DPI-Skalierung](assets/screens/dpi-scaling.png)

**Unterstützte Auflösungen:**
- **Full HD:** 1920 × 1080 (Standard)
- **4K UHD:** 3840 × 2160
- **WQHD:** 2560 × 1440
- **Ultrawide:** 3440 × 1440
- **Weitere:** Alle von Windows unterstützten Auflösungen

**DPI-Skalierung:**
```
100% (Standard)    → Keine Anpassung
125% (empfohlen)   → Text und UI 25% größer
150% (4K-Displays) → Text und UI 50% größer
200% (UHD/Retina)  → Text und UI doppelt so groß
```

**Automatische Anpassung:**
- Tiptorro Live Quotes erkennt DPI-Einstellungen automatisch
- Vollbild-Fenster nutzen immer die native Monitor-Auflösung
- Kein manueller Eingriff erforderlich

### Kiosk-Modus und Vollbild

![Kiosk-Modus](assets/screens/kiosk-mode.png)

**Kiosk-Eigenschaften:**
- ✅ **Vollbild:** Keine Titelleiste, keine Rahmen
- ✅ **Immer im Vordergrund:** Andere Programme können nicht überlagern
- ✅ **Maus-Cursor verborgen:** Nach 3 Sekunden Inaktivität
- ✅ **Tastenkombinationen deaktiviert:** Alt+Tab, Windows-Taste blockiert
- ✅ **Automatischer Neustart:** Bei Absturz der Website

**Verlassen des Kiosk-Modus:**
- **Notaus-Hotspot:** Ganz links am Bildschirm-Rand klicken
- **Taskleiste:** Haupt-Interface über Windows-Taskleiste aufrufen

### Monitor-Layout-Beispiele

**Szenario 1: Einzelhandel (2 Monitore)**
```
[Monitor 1: Primary]     [Monitor 2: Secondary]
├── Speisekarte          ├── Aktuelle Angebote
├── 1920×1080           ├── 1920×1080
└── https://menu.de      └── https://offers.de
```

**Szenario 2: Sportwetten (3 Monitore)**
```
[Monitor 1]              [Monitor 2]              [Monitor 3]
├── Live-Ticker          ├── Quoten              ├── Ergebnisse
├── 1920×1080           ├── 1920×1080           ├── 1920×1080
└── /livescoretv         └── /odds               └── /results
```

**Szenario 3: Corporate (4K + Standard)**
```
[Monitor 1: 4K]                    [Monitor 2: Standard]
├── Dashboard (hochauflösend)      ├── Nachrichten-Ticker
├── 3840×2160                     ├── 1920×1080
└── /dashboard-4k                  └── /news-ticker
```

**✅ Multi-Monitor-Setup-Checkliste:**
- [ ] Alle Monitore werden automatisch erkannt
- [ ] Hot-Plug funktioniert (Monitor an-/abstecken)
- [ ] DPI-Skalierung wird korrekt angewendet
- [ ] Kiosk-Modus arbeitet störungsfrei
- [ ] Notaus-Funktion ist auf allen Monitoren verfügbar

---

## Fehlerbehebung

### Häufige Probleme und Lösungen

#### Problem 1: Monitor wird nicht erkannt

![Monitor nicht erkannt](assets/screens/monitor-not-detected.png)

**Symptome:**
- In der Oberfläche werden weniger Monitore angezeigt als angeschlossen
- "1 TV-Gerät erkannt" obwohl 2 Monitore angeschlossen sind

**Lösungsschritte:**

1. **Windows-Bildschirm-Erkennung:**
   ```
   Windows-Taste + P → "Erkennen" → "Erweitern"
   ```

2. **Monitor-Status prüfen:**
   - Rechtsklick auf Desktop → "Anzeigeeinstellungen"
   - Prüfen: Sind alle Monitore als "Erweitert" konfiguriert?

3. **Tiptorro neu starten:**
   - "BEENDEN" → Programm komplett schließen
   - Erneut starten → Monitor-Erkennung läuft automatisch

4. **Hardware prüfen:**
   - HDMI/DisplayPort-Kabel fest eingesteckt?
   - Monitor eingeschaltet und auf richtige Quelle?
   - Grafikkarten-Treiber aktuell?

**Erwartetes Ergebnis:**
```
[LOG] Display-Anzahl: 1 → 2 Monitore
✅ Status: "2 TV-Geräte erkannt"
```

#### Problem 2: Website lädt nicht / bleibt schwarz

![Website lädt nicht](assets/screens/website-loading-error.png)

**Symptome:**
- Monitor zeigt schwarzen Bildschirm oder "Kann nicht geladen werden"
- Endlose Ladezeit

**Lösungsschritte:**

1. **URL direkt testen:**
   - Öffnen Sie die URL in einem normalen Browser (Chrome/Edge)
   - Funktioniert die Website grundsätzlich?

2. **Internet-Verbindung prüfen:**
   ```bash
   ping google.com
   ```

3. **URL-Format prüfen:**
   ```
   ✅ Korrekt: https://beispiel.de/pfad
   ❌ Falsch: beispiel.de (ohne https://)
   ❌ Falsch: http://... (unsichere Verbindung)
   ```

4. **Firewall/Proxy prüfen:**
   - Unternehmens-Netzwerk: IT-Administrator kontaktieren
   - Private Nutzung: Windows Defender Firewall temporär deaktivieren

5. **Alternative URL testen:**
   - Verwenden Sie zunächst: `https://shop.tiptorro.com/livescoretv`
   - Funktioniert das? → Problem liegt an Ihrer ursprünglichen URL

**Erwartetes Ergebnis:**
Website lädt innerhalb von 10 Sekunden und zeigt Inhalt an.

#### Problem 3: Anwendung startet nicht

![Anwendung startet nicht](assets/screens/app-not-starting.png)

**Symptome:**
- Doppelklick auf Desktop-Symbol → nichts passiert
- Fehlermedlung beim Start

**Lösungsschritte:**

1. **Als Administrator ausführen:**
   - Rechtsklick auf Desktop-Symbol
   - "Als Administrator ausführen"

2. **Windows-Ereignisanzeige prüfen:**
   ```
   Windows-Taste + R → "eventvwr.msc" → Enter
   → Windows-Protokolle → Anwendung
   → Nach "Tiptorro" oder "Electron" suchen
   ```

3. **Neuinstallation:**
   - Programme und Features → "Tiptorro Live Quotes" → Deinstallieren
   - Download von offizieller Quelle
   - Neuinstallation als Administrator

4. **Kompatibilitätsmodus:**
   - Rechtsklick auf Programm-Icon
   - "Eigenschaften" → "Kompatibilität"
   - ☑️ "Programm im Kompatibilitätsmodus ausführen"
   - "Windows 10" auswählen

**Erwartetes Ergebnis:**
Anwendung startet innerhalb von 30 Sekunden und zeigt Haupt-Interface.

#### Problem 4: Performance-Probleme / Langsamer Betrieb

![Performance-Probleme](assets/screens/performance-issues.png)

**Symptome:**
- Verzögerungen beim Wechseln zwischen Inhalten
- Hohe CPU/RAM-Nutzung
- System wird langsam

**Lösungsschritte:**

1. **Performance-Dashboard öffnen:**
   - "ERWEITERTE EINSTELLUNGEN" → Performance-Tab
   - Aktuelle Werte prüfen:
   ```
   RAM-Nutzung: < 300 MB (normal)
   CPU-Nutzung: < 15% (normal)
   Uptime: Seit letztem Start
   ```

2. **Refresh-Intervall anpassen:**
   - "ERWEITERTE EINSTELLUNGEN" → Refresh-Tab
   - **Standard:** 60 Sekunden
   - **Bei Performance-Problemen:** 120 Sekunden oder mehr

3. **Anzahl Monitore reduzieren:**
   - Temporär nur 1-2 Monitore verwenden
   - Bessert sich die Performance?

4. **Website-Optimierung:**
   - Vermeiden Sie video-lastigen Content auf mehreren Monitoren
   - Nutzen Sie optimierte Inhalte (statische Bilder, Text)

5. **System-Ressourcen prüfen:**
   ```
   Task-Manager öffnen (Ctrl+Shift+Esc)
   → Prozesse → "Tiptorro Live Quotes"
   → RAM/CPU-Verbrauch beobachten
   ```

**Erwartetes Ergebnis:**
- RAM-Nutzung: < 300 MB
- CPU-Nutzung: < 15%
- Flüssige Darstellung ohne Verzögerungen

#### Problem 5: Automatische Updates schlagen fehl

![Update-Probleme](assets/screens/update-issues.png)

**Symptome:**
- Update-Benachrichtigung, aber Download schlägt fehl
- "Update-Server nicht erreichbar"

**Lösungsschritte:**

1. **Internet-Verbindung testen:**
   - Browser öffnen → https://download.tiptorro.com aufrufen
   - Erreichen Sie die Download-Seite?

2. **Manuelles Update:**
   - Programm komplett schließen
   - Neue Version von offizieller Website herunterladen
   - Installation über bestehende Version (überschreibt automatisch)

3. **Update-Einstellungen prüfen:**
   - "ERWEITERTE EINSTELLUNGEN" → Update-Tab
   - ☑️ "Automatische Updates aktiviert"
   - "Jetzt nach Updates suchen"

4. **Firewall-Ausnahme:**
   ```
   Windows Defender Firewall → 
   "App durch Firewall zulassen" → 
   "Tiptorro Live Quotes" → ✅ Privat + ✅ Öffentlich
   ```

**Erwartetes Ergebnis:**
Update wird erfolgreich heruntergeladen und installiert.

### Log-Dateien für Support

![Log-Dateien finden](assets/screens/log-files-location.png)

**Log-Dateien-Pfad:**
```
C:\Users\[Ihr Benutzername]\AppData\Roaming\Tiptorro Live Quotes\logs\
```

**Wichtige Log-Dateien:**

1. **combined.log** - Alle Aktivitäten und Status-Meldungen
2. **error.log** - Nur Fehler und Warnungen
3. **analytics.json** - Nutzungsstatistiken (anonym)

**Log-Dateien an Support senden:**

1. **Windows Explorer öffnen:**
   - Windows-Taste + R → `%APPDATA%\Tiptorro Live Quotes\logs` → Enter

2. **Alle .log-Dateien markieren:**
   - Ctrl+A → Alle Dateien auswählen

3. **Komprimieren:**
   - Rechtsklick → "Senden an" → "ZIP-komprimierten Ordner"
   - Dateiname: `Tiptorro-Logs-[Ihr Name]-[Datum].zip`

4. **Per E-Mail senden:**
   - An: support@tiptorro.com
   - Betreff: "Technischer Support - [Ihr Problem]"
   - Anhang: Die ZIP-Datei

**✅ Fehlerbehebung-Checkliste:**
- [ ] Häufige Probleme selbst gelöst
- [ ] Log-Dateien bei anhaltenden Problemen gesichert
- [ ] Performance-Dashboard zur Überwachung genutzt
- [ ] Support kontaktiert falls nötig (mit Logs)

---

## Support & Kontakt

### Kontaktmöglichkeiten

**E-Mail-Support (primär):**
```
support@tiptorro.com
```
- **Antwortzeit:** 1-2 Werktage
- **Sprachen:** Deutsch, Englisch
- **Bitte immer beilegen:** Log-Dateien (siehe Fehlerbehebung)

**Website & Dokumentation:**
```
https://help.tiptorro.com/live-quotes
```
- Knowledge Base mit häufigen Problemen
- Video-Tutorials
- Download-Bereich für Updates

**Telefon-Support (Business-Kunden):**
```
+49 (0) 123 456 789
```
- **Verfügbar:** Mo-Fr, 9:00-17:00 Uhr
- **Nur für:** Kunden mit Business-Lizenz

### Support-Anfrage stellen

**Optimale Support-Anfrage:**

1. **Betreff-Zeile:**
   ```
   [Tiptorro Live Quotes] Problem: [Kurzbeschreibung]
   
   Beispiele:
   - [Tiptorro Live Quotes] Problem: Monitor 2 wird nicht erkannt
   - [Tiptorro Live Quotes] Problem: Website lädt nicht auf allen Monitoren
   ```

2. **E-Mail-Inhalt:**
   ```
   Hallo Support-Team,

   ich nutze Tiptorro Live Quotes Version 2.0 und habe folgendes Problem:

   PROBLEM:
   [Detaillierte Beschreibung des Problems]

   SYSTEM:
   - Windows-Version: [z.B. Windows 11]
   - Anzahl Monitore: [z.B. 3]
   - Monitore-Auflösung: [z.B. alle 1920x1080]

   BEREITS VERSUCHT:
   - [Was haben Sie bereits versucht?]
   - [Funktioniert das Problem reproduzierbar?]

   LOG-DATEIEN:
   [Im Anhang: Logs.zip]

   Mit freundlichen Grüßen,
   [Ihr Name]
   ```

3. **Anhänge:**
   - **Log-Dateien** (siehe Fehlerbehebung-Kapitel)
   - **Screenshots** des Problems (falls visuell)

### Häufig gestellte Fragen (FAQ)

**F: Kann ich die Software kostenlos nutzen?**
```
A: Ja, Tiptorro Live Quotes ist für nicht-kommerzielle Nutzung kostenlos.
   Für gewerbliche Nutzung ist eine Business-Lizenz erforderlich.
```

**F: Wie viele Monitore werden unterstützt?**
```
A: Theoretisch unbegrenzt, praktisch getestet bis 10 Monitore.
   Begrenzt durch Ihre Grafikkarte und System-Performance.
```

**F: Werden auch Mac und Linux unterstützt?**
```
A: Aktuell nur Windows. Mac/Linux-Versionen sind in Planung.
```

**F: Kann ich eigene Websites/Inhalte anzeigen?**
```
A: Ja, jede HTTPS-Website ist unterstützt. HTTP-Seiten aus Sicherheitsgründen nicht.
```

**F: Wie oft wird die Software aktualisiert?**
```
A: Etwa alle 2-3 Monate mit neuen Features und monatliche Bug-Fix-Updates.
```

**F: Werden meine Daten an Tiptorro gesendet?**
```
A: Nein. Alle Daten bleiben lokal. Nur anonyme Nutzungsstatistiken (optional).
```

**✅ Support-Checkliste:**
- [ ] Problem in FAQ nachgeschlagen
- [ ] Fehlerbehebung selbst versucht
- [ ] Log-Dateien vorbereitet
- [ ] Support-Anfrage mit allen Informationen gestellt

---

## Kurzanleitung (One-Pager)

### 🚀 Quick-Start (5 Minuten)

**1. Download & Installation:**
```
Download: https://download.tiptorro.com/live-quotes/latest
Installation: Standard-Einstellungen, Administrator-Rechte erforderlich
```

**2. Erste Konfiguration:**
```
✅ Programme starten
✅ Monitore automatisch erkannt
✅ Favorit wählen ODER URL eingeben
✅ "LIVE-VIEWS STARTEN" klicken
```

**3. Sofort loslegen:**
```
Monitor 1: https://shop.tiptorro.com/livescoretv
Monitor 2: https://docs.google.com/spreadsheets/[Ihre-ID]
```

### 🔧 Wichtigste Bedienelemente

| Aktion | Weg |
|--------|-----|
| **Live-Views starten** | "LIVE-VIEWS STARTEN" |
| **Alles stoppen** | Links am Bildschirm klicken (Notaus) |
| **Favoriten verwalten** | "FAVORITEN BEARBEITEN" |
| **Autostart ein/aus** | "AUTO-START" |
| **Einstellungen** | "ERWEITERTE EINSTELLUNGEN" |
| **Programm beenden** | "BEENDEN" |

### 🖥️ Multi-Monitor Quick-Tipps

```
✅ Hot-Plug: Monitore an-/abstecken funktioniert automatisch
✅ DPI-Skalierung: Wird automatisch erkannt
✅ Kiosk-Modus: Vollbild ohne Rahmen
✅ Notaus: Ganz links am Bildschirm klicken
```

### 🆘 Schnelle Problemlösung

| Problem | Lösung |
|---------|--------|
| **Monitor nicht erkannt** | Windows+P → "Erweitern" → Tiptorro neustarten |
| **Website lädt nicht** | URL in normalem Browser testen |
| **Performance-Probleme** | Refresh-Intervall erhöhen (Erweiterte Einstellungen) |
| **Programm startet nicht** | Als Administrator ausführen |

### 📞 Support

```
E-Mail: support@tiptorro.com
Hilfe: https://help.tiptorro.com/live-quotes
Logs: %APPDATA%\Tiptorro Live Quotes\logs\
```

### ✅ Erfolgreiche Installation

Nach erfolgreicher Einrichtung sollten Sie folgendes sehen:
- [x] **Haupt-Interface** öffnet sich automatisch
- [x] **Alle Monitore erkannt** ("X TV-Geräte erkannt")
- [x] **Live-Views funktionieren** (Vollbild-Darstellung)
- [x] **Notaus-Funktion** funktioniert (links klicken)
- [x] **Performance stabil** (< 300 MB RAM)

---

**🎉 Herzlichen Glückwunsch! Tiptorro Live Quotes ist erfolgreich eingerichtet.**

*Für weitere Unterstützung besuchen Sie: https://help.tiptorro.com*

---

![Tiptorro Logo](assets/tiptorro-logo.png)

**Tiptorro Live Quotes v2.0** - Copyright © 2025 Torro Tec GmbH  
Alle Rechte vorbehalten.