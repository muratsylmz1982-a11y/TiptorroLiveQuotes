# TTQuotes - Support Installations-Anleitung

**Version:** 1.2.3  
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

Die Installationsdatei `TTQuotes Setup 1.2.3.exe` wird vom Support bereitgestellt.

#### Installation:

1. **Installer starten:** `TTQuotes Setup 1.2.3.exe`
2. **Windows SmartScreen-Warnung:**
   ```
   "Weitere Informationen" → "Trotzdem ausführen"
   ```
   ⚠️ **Normal!** App ist nicht signiert, aber sicher.

3. **UAC-Dialog:** "Ja" klicken

4. **Installation läuft:** 10-20 Sekunden

5. **App startet automatisch** nach Installation

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

### Schritt 8: Test & Validierung

**Finaler Test-Durchlauf:**

1. **Alle Monitore prüfen:**
   - [ ] Zeigen korrekte Inhalte?
   - [ ] Keine Fehlermeldungen?
   - [ ] Inhalte laden?

2. **PC-Neustart-Test** (wichtig!):
   ```
   Windows → Neu starten
   ```
   - Nach Neustart: TTQuotes startet automatisch?
   - Alle Monitore zeigen wieder Inhalte?
   - **Dauer:** 30-60 Sekunden bis alles läuft

3. **Mit Shop-Mitarbeiter durchgehen:**
   - Zeigen, dass alles läuft
   - Kurz erklären: "Läuft automatisch, bei Problemen anrufen"
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
- [ ] Shop-Mitarbeiter informiert
- [ ] Installations-Datum dokumentiert
- [ ] TeamViewer-Verbindung getrennt

---

## ✅ Quick Reference Card

**Für den Schreibtisch:**

```
═══════════════════════════════════════════════
   TTQuotes - Support Quick Reference
═══════════════════════════════════════════════

1. TeamViewer verbinden
2. Installer starten (SmartScreen: "Trotzdem ausführen")
3. App startet automatisch
4. Monitore konfigurieren (Dropdown oder URL)
5. Vorschau testen
6. "LIVE-VIEWS STARTEN"
7. Autostart aktivieren
8. PC-Neustart testen
9. Shop-Mitarbeiter einweisen

Notfall: ESC = App beenden

═══════════════════════════════════════════════
```

---

*Letzte Aktualisierung: Oktober 2025*

