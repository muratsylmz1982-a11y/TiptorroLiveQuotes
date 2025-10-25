# TTQuotes - Support Installations-Anleitung

![Tiptorro Logo](../assets/logo2.png)

**Version:** 1.2.5  
**Zielgruppe:** IT-Support / Techniker  
**Stand:** Oktober 2025

---

## 📋 Übersicht

Diese Anleitung beschreibt die **Remote-Installation** und **Konfiguration** von TTQuotes in Tiptorro-Shops via TeamViewer.

**Geschätzte Dauer:** 5-10 Minuten pro Shop (abhängig von Monitor-Anzahl)

---

## ✅ Voraussetzungen

### System-Anforderungen:
- ✅ Windows 10/11 (64-bit)
- ✅ Mind. 4GB RAM
- ✅ Stabile Internet-Verbindung
- ✅ Alle TV-Monitore an PC angeschlossen und eingeschaltet

### Benötigte Software:
- ✅ TeamViewer (für Remote-Installation)
- ✅ TTQuotes Installer (aktuellste Version aus GitHub Releases)

### Zugriff benötigt:
- ✅ Administrator-Rechte auf Ziel-PC
- ✅ TeamViewer-ID des Shop-PCs
- ✅ Liste der gewünschten URLs pro Monitor

---

## 🚀 Installations-Prozess

### Schritt 1: Remote-Verbindung herstellen

1. TeamViewer öffnen
2. TeamViewer-ID vom Shop-Mitarbeiter erfragen
3. Verbindung herstellen
4. Administrator-Rechte anfordern (falls nötig)

**Tipp:** Kurze Begrüßung, ca. Dauer nennen (15-30 Min.)

---

### Schritt 2: System prüfen

**Wichtig vor Installation prüfen:**

```powershell
# Windows-Version
winver

# Monitore angeschlossen?
# Windows-Einstellungen → System → Anzeige
```

**Checkliste:**
- [ ] Windows 10/11 64-bit?
- [ ] Alle Monitore sichtbar in Windows?
- [ ] Monitore richtig angeordnet? (Position 1, 2, 3...)
- [ ] Internet-Verbindung stabil?

---

### Schritt 3: TTQuotes installieren

#### Installer verwenden:

Die Installationsdatei `TTQuotes Setup 1.2.5.exe` wird vom Support bereitgestellt.

**Download:** https://github.com/muratsylmz1982-a11y/TiptorroLiveQuotes/releases/latest

#### Installation:

1. **Installer starten:** `TTQuotes Setup 1.2.5.exe` (ca. 73 MB)
2. **Windows SmartScreen-Warnung:**
   ```
   "Weitere Informationen" → "Trotzdem ausführen"
   ```
   ⚠️ **Normal!** App ist nicht signiert, aber sicher.

3. **UAC-Dialog:** "Ja" klicken

4. **Installation läuft:** 10-20 Sekunden

5. **App startet automatisch** nach Installation

**Neue Features in v1.2.5:**
- ✅ **Error Handler System** - Automatische Crash-Recovery
- ✅ **Health Check Dashboard** - Echtzeit-System-Überwachung
- ✅ **Global Hotkey** (Strg+Shift+H) - Schnellzugriff auf Health Check

---

### Schritt 4: Erste Konfiguration

#### Was Sie jetzt sehen:

- **Hauptmonitor:** Konfigurations-UI (schwarz mit Einstellungen)
- **Alle anderen Monitore:** Wartebildschirme mit "Konfiguration erforderlich"

#### Monitor-Nummer merken!

Jeder Wartebildschirm zeigt unten links eine **große Nummer** (1, 2, 3, 4...).  
Diese Nummer = Monitor in der Config-UI!

**Tipp:** Screenshot machen oder aufschreiben:
```
Monitor 1 = Links außen
Monitor 2 = Mitte
Monitor 3 = Rechts
```

---

### Schritt 5: URLs zuweisen

#### In der Konfigurations-UI (Hauptmonitor):

1. **Für jeden Monitor:**
   - Dropdown-Menü öffnen
   - **Favorit wählen** (empfohlen) ODER
   - **Eigene URL** eingeben

2. **Favoriten (vorkonfiguriert):**
   ```
   - Live TV - Seite 1
   - Live TV - Seite 2
   - Live TV - Seite 3
   - LiveScore TV
   - Ticketchecker
   ```

3. **Eigene URL (falls nötig):**
   ```
   Beispiel: https://shop.tiptorro.com/livetv/?rows=12&scan=true&page=1
   ```

4. **Vorschau testen:** "Vorschau" Button klicken
   - Mini-Fenster zeigt Seite
   - Prüfen: Lädt korrekt? Inhalte sichtbar?

---

### Schritt 6: Konfiguration aktivieren

1. **Alle Monitore konfiguriert?** ✓
2. **Vorschau geprüft?** ✓
3. **Button klicken:** **"LIVE-VIEWS STARTEN"**

#### Was jetzt passiert:

- Config-UI schließt sich
- Alle Monitore zeigen nun ihre zugewiesenen Inhalte
- **Warten:** 10-20 Sekunden bis alles geladen ist

---

### Schritt 7: Autostart aktivieren

**Wichtig:** Damit App nach PC-Neustart automatisch startet!

1. Auf Config-UI (falls nicht sichtbar: ESC drücken)
2. **Unten links:** "Autostart" Button
3. Klicken → sollte grün/aktiv werden

**Alternativ prüfen:**
```powershell
# Windows-Autostart-Ordner prüfen:
shell:startup
# Sollte TTQuotes-Verknüpfung enthalten
```

---

### Schritt 8: Health Check Dashboard testen (NEU v1.2.5)

**System-Überwachung demonstrieren:**

1. **Health Check Dashboard öffnen:**
   - Drücken Sie **Strg + Shift + H** (oder klicken Sie "🏥 HEALTH CHECK")
   - Dashboard öffnet sich **immer im Vordergrund** (auch über Live-Views)

2. **Status prüfen:**
   - [ ] **Overall Status:** Sollte "HEALTHY" sein (grün)
   - [ ] **Monitore:** Zeigt Anzahl aktiver Displays (z.B. "3 Monitore")
   - [ ] **Memory:** Sollte < 300 MB sein
   - [ ] **CPU:** Sollte < 15% sein
   - [ ] **Network:** "Online" mit Latenz < 100ms

3. **Auto-Monitoring aktivieren:**
   - Klicken Sie "Start Monitoring"
   - Dashboard aktualisiert sich automatisch alle 5 Sekunden
   - Zeigen Sie dem Shop-Mitarbeiter: "Hier sehen Sie den System-Status"

**Warum Health Check Dashboard?**
- ✅ Überwachung ohne Live-Views zu stoppen
- ✅ Erkennung von Problemen bevor sie kritisch werden
- ✅ Einfacher Support: Screenshots mit vollständiger System-Info

---

### Schritt 9: Test & Validierung

**Finaler Test-Durchlauf:**

1. **Alle Monitore prüfen:**
   - [ ] Zeigen korrekte Inhalte?
   - [ ] Keine Fehlermeldungen?
   - [ ] Inhalte laden?

2. **Health Check prüfen:**
   - [ ] Strg+Shift+H funktioniert?
   - [ ] Dashboard zeigt "HEALTHY"?
   - [ ] Alle Monitore im Dashboard sichtbar?

3. **PC-Neustart-Test** (wichtig!):
   ```
   Windows → Neu starten
   ```
   - Nach Neustart: TTQuotes startet automatisch?
   - Alle Monitore zeigen wieder Inhalte?
   - **Dauer:** 30-60 Sekunden bis alles läuft

4. **Mit Shop-Mitarbeiter durchgehen:**
   - Zeigen, dass alles läuft
   - **NEU:** Health Check Dashboard demonstrieren (Strg+Shift+H)
   - Kurz erklären: "Läuft automatisch, bei Problemen anrufen oder Health Check öffnen"
   - Notfall-Kontakt bestätigen

---

## 🔧 Erweiterte Einstellungen (optional)

### Refresh-Intervall ändern

**Standard:** 20 Minuten

**Ändern:**
1. ESC drücken (zurück zur Config-UI)
2. "Erweiterte Einstellungen" Button
3. "Refresh-Intervall" ändern (Minimum: 30 Sekunden)
4. "Speichern"
5. "LIVE-VIEWS STARTEN" erneut

**Empfehlung:** Standard beibehalten (20 Min.)

### Overlay-Anzeige-Dauer

**Standard:** 3,5 Sekunden

**Ändern:**
- Erweiterte Einstellungen → "Overlay-Anzeigedauer"
- Bereich: 1-10 Sekunden
- Bestimmt, wie lange das Lade-Symbol sichtbar ist

---

## 🆘 Troubleshooting

### Diagnose mit Health Check Dashboard (NEU)

**Bevor Sie Troubleshooting starten:**

1. Drücken Sie **Strg + Shift + H** um Health Check Dashboard zu öffnen
2. Prüfen Sie den **Overall Status**:
   - 🟢 **HEALTHY:** Alles OK
   - 🟡 **WARNING:** Kleinere Probleme (z.B. keine Monitore aktiv, hohe CPU)
   - 🔴 **CRITICAL:** Schwerwiegende Probleme (Crashes, kritischer Speicher)

3. Schauen Sie ins **Error Log** (unten im Dashboard):
   - Letzte 10 Fehler werden angezeigt
   - Screenshot machen für Support-Ticket

**Häufige Warnungen und ihre Bedeutung:**

| Warning | Bedeutung | Lösung |
|---------|-----------|--------|
| "No displays active" | Keine Live-Views laufen | Normal wenn Config-UI offen ist |
| "High memory usage" | RAM > 70% | Refresh-Intervall erhöhen |
| "High CPU load" | CPU > 60% | Weniger Monitore oder Performance-PC |
| "Network offline" | Keine Internet-Verbindung | Internet-Verbindung prüfen |

---

### Problem: "Windows hat diesen PC geschützt"

**Lösung:**
```
"Weitere Informationen" → "Trotzdem ausführen"
```
**Grund:** App ist nicht code-signiert (normal, sicher)

---

### Problem: Monitor zeigt "Konfiguration erforderlich"

**Ursache:** Monitor wurde nicht konfiguriert

**Lösung:**
1. ESC drücken
2. Fehlenden Monitor in Config-UI konfigurieren
3. "LIVE-VIEWS STARTEN"

---

### Problem: Seite lädt nicht / Fehler

**Mögliche Ursachen:**
- ❌ Keine Internet-Verbindung
- ❌ Firewall blockiert
- ❌ URL falsch eingegeben
- ❌ Ziel-Server nicht erreichbar

**Lösung:**
1. Internet prüfen (Browser-Test)
2. URL in Browser testen
3. Vorschau-Funktion nutzen
4. Firewall-Ausnahme für TTQuotes

---

### Problem: App startet nicht nach PC-Neustart

**Lösung:**
1. Autostart-Button prüfen (aktiviert?)
2. Manuell starten: `C:\Program Files\TTQuotes\TTQuotes.exe`
3. Autostart erneut aktivieren

---

### Problem: Falsche Monitor-Zuordnung

**Windows hat Monitore neu nummeriert**

**Lösung:**
1. Windows-Einstellungen → System → Anzeige
2. Monitore richtig anordnen (1, 2, 3...)
3. "Übernehmen"
4. TTQuotes neu starten (ESC → LIVE-VIEWS STARTEN)

---

### Problem: App ist abgestürzt / Fenster reagiert nicht

**NEU in v1.2.5: Error Handler kümmert sich automatisch!**

**Was passiert automatisch:**
- ✅ Abgestürzte Fenster werden **automatisch neu geladen**
- ✅ Eingefrorene Fenster werden **automatisch erkannt**
- ✅ Fehler werden **geloggt** und im Health Check Dashboard angezeigt

**Manuelles Eingreifen nur nötig wenn:**
- Fenster nach 30 Sekunden nicht neu lädt
- Crash-Dialog erscheint

**Dann:**
1. Öffnen Sie Health Check Dashboard (Strg+Shift+H)
2. Prüfen Sie Error Log
3. Machen Sie Screenshot für Support
4. App neu starten (ESC → LIVE-VIEWS STARTEN)

---

### Problem: Health Check Dashboard zeigt WARNING obwohl alles läuft

**Erklärung:**

Wenn **keine Live-Views** laufen (nur Config-UI offen), zeigt Health Check:
- Status: 🟡 **WARNING**
- Monitore: **0 Monitore aktiv**

**Das ist normal!**

Sobald Sie "LIVE-VIEWS STARTEN" klicken, ändert sich zu:
- Status: 🟢 **HEALTHY**
- Monitore: **X Monitore aktiv** (z.B. 3)

---

### Problem: Hohe CPU/RAM-Nutzung

**Diagnose mit Health Check:**

1. Öffnen Sie Health Check Dashboard (Strg+Shift+H)
2. Prüfen Sie aktuelle Werte:
   - **Normal:** RAM < 300 MB, CPU < 15%
   - **Hoch:** RAM > 500 MB, CPU > 30%

**Lösungen:**

1. **Refresh-Intervall erhöhen:**
   - Erweiterte Einstellungen → Refresh-Intervall auf 30 Min. erhöhen

2. **Anzahl Monitore reduzieren:**
   - Temporär weniger Monitore verwenden
   - Prüfen ob Performance besser wird

3. **System-Upgrade empfehlen:**
   - Bei 4+ Monitoren: Mind. 8GB RAM empfohlen
   - Dedizierte Grafikkarte hilft

---

## 📊 Konfigurations-Beispiele

### Beispiel 1: 3 Monitore - Live TV

```
Monitor 1 (Links):  Live TV - Seite 1
Monitor 2 (Mitte):  Live TV - Seite 2  
Monitor 3 (Rechts): Live TV - Seite 3
```

### Beispiel 2: 2 Monitore - Mixed

```
Monitor 1: Live TV - Seite 1
Monitor 2: LiveScore TV
```

### Beispiel 3: 4 Monitore - Custom URLs

```
Monitor 1: https://shop.tiptorro.com/livetv/?rows=12&page=1
Monitor 2: https://shop.tiptorro.com/livetv/?rows=12&page=2
Monitor 3: https://shop.tiptorro.com/livetv/?rows=12&page=3
Monitor 4: https://shop.tiptorro.com/livescoretv/?rows=6
```

---

## 📝 Post-Installation Checkliste

**Nach erfolgreicher Installation abhaken:**

- [ ] Installation abgeschlossen (keine Fehler)
- [ ] Alle Monitore zeigen korrekte Inhalte
- [ ] Autostart aktiviert
- [ ] PC-Neustart getestet
- [ ] **NEU:** Health Check Dashboard getestet (Strg+Shift+H)
- [ ] **NEU:** Health Check zeigt "HEALTHY" Status
- [ ] **NEU:** Shop-Mitarbeiter mit Health Check Dashboard vertraut gemacht
- [ ] Shop-Mitarbeiter informiert
- [ ] Installations-Datum dokumentiert
- [ ] TeamViewer-Verbindung getrennt

---

## ✅ Quick Reference Card

**Für den Schreibtisch:**

```
═══════════════════════════════════════════════
   TTQuotes v1.2.5 - Support Quick Reference
═══════════════════════════════════════════════

1. TeamViewer verbinden
2. Installer starten (SmartScreen: "Trotzdem ausführen")
3. App startet automatisch
4. Monitore konfigurieren (Dropdown oder URL)
5. Vorschau testen
6. "LIVE-VIEWS STARTEN"
7. Autostart aktivieren
8. ⭐ NEU: Health Check testen (Strg+Shift+H)
9. PC-Neustart testen
10. Shop-Mitarbeiter einweisen

Notfall: ESC = App beenden

NEU in v1.2.5:
• Strg+Shift+H = Health Check Dashboard
• Automatische Crash-Recovery
• Error-Logging mit letzten 10 Fehlern

═══════════════════════════════════════════════
```

---

## 🏥 Health Check Dashboard - Kurzanleitung

**Für Shop-Mitarbeiter:**

```
═══════════════════════════════════════════════
   Health Check Dashboard - Schnellhilfe
═══════════════════════════════════════════════

ÖFFNEN:
• Tastenkombination: Strg + Shift + H
• Oder: Button "🏥 HEALTH CHECK" im Hauptfenster

STATUS-ANZEIGE:
🟢 HEALTHY   = Alles OK, läuft normal
🟡 WARNING   = Kleinere Probleme, aber läuft
🔴 CRITICAL  = Schwerwiegende Probleme!

WAS WIRD ÜBERWACHT:
✓ Monitore (Anzahl aktiv, Status)
✓ Speicher (RAM-Nutzung)
✓ CPU (Prozessor-Auslastung)
✓ Internet (Verbindung, Geschwindigkeit)
✓ Fehler (Letzte 10 Fehler)

MONITORING STARTEN:
• Button "Start Monitoring" klicken
• Dashboard aktualisiert sich alle 5 Sekunden
• Immer im Vordergrund, auch über Live-Views

BEI PROBLEMEN:
1. Screenshot vom Dashboard machen
2. An Support senden: support@tiptorro.com
3. Dashboard schließen (X oben rechts)

═══════════════════════════════════════════════
```

---

## 🛡️ Error Handler System - Info für Support

**Automatische Fehlerbehandlung in v1.2.5:**

**Was macht der Error Handler?**
- ✅ Fängt alle Crashes und Fehler automatisch ab
- ✅ Startet abgestürzte Fenster automatisch neu
- ✅ Loggt alle Fehler mit Details (Typ, Message, Timestamp)
- ✅ Zeigt letzte 10 Fehler im Health Check Dashboard

**Fehlertypen die automatisch behandelt werden:**
1. **Renderer Crashes** → Fenster wird automatisch neu geladen
2. **GPU Crashes** → GPU-Prozess startet automatisch neu
3. **Unresponsive Windows** → Dialog erscheint: "Warten" oder "Neu laden"
4. **Uncaught Exceptions** → Fehler wird geloggt, App läuft weiter
5. **Promise Rejections** → Fehler wird geloggt, App läuft weiter

**Für Support bedeutet das:**
- ✅ **Weniger Support-Calls** wegen Crashes
- ✅ **Bessere Diagnose** durch Error-Logs
- ✅ **24/7-Betrieb** ohne manuelle Eingriffe
- ✅ **Remote-Diagnose** via Health Check Screenshots

**Error-Logs abrufen:**
```
Pfad: C:\Users\[Username]\AppData\Roaming\ttquotes\logs\
Dateien:
  - combined.log (alle Events)
  - error.log (nur Fehler)
  - analytics.json (Statistiken)
```

---

*Letzte Aktualisierung: Oktober 2025 (v1.2.5)*

![Tiptorro Logo](../assets/logo2.png)

