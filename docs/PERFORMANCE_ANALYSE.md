# Performance-Analyse: Multi-Monitor System (TTQuotes)

**Projekt:** TTQuotes (Electron-basiertes Multi-Monitor Display-System)  
**Problem:** Performance-Problem ab ca. 6 angeschlossenen TV-Geräten  
**Erstellt:** 2025-01-XX  
**Analyse durch:** Senior Performance Engineer

---

## 1. Performance-Analyse: Wahrscheinlichkeitsranking der Ursachen

### Tech-Stack (ermittelt)
- **Framework:** Electron 28 (Chromium ~122)
- **Architektur:** 1 Main-Prozess + N Renderer-Prozesse (je Display = 1 BrowserWindow)
- **Hardware-Acceleration:** Standardmäßig aktiv (keine explizite Deaktivierung gefunden)
- **Background Throttling:** Deaktiviert für alle Live-Display-Fenster
- **Auflösung (angenommen):** 1920×1080 pro Display (typisch für TV-Geräte)
- **Refresh-Rate (angenommen):** 60Hz pro Display

---

### **1.1. Wahrscheinlichkeitsranking der Ursachen (nach Impact & Wahrscheinlichkeit)**

#### **🔴 KRITISCH: Sehr wahrscheinlich (>80%)**

**1. GPU/VRAM-Limit durch Multi-Monitor Rendering**
- **Wahrscheinlichkeit:** 85%
- **Begründung:**
  - Jedes Display = 1 Fullscreen-BrowserWindow (1920×1080 @ 60Hz)
  - 6 Displays = **~12.4 MPixel/s @ 60fps = ~744 MPixel/s Rendering-Last**
  - Jeder Renderer-Prozess erstellt GPU-Layer (Compositing)
  - Chromium nutzt GPU für:
    - CSS-Transforms/Animations (auch in den Websites)
    - WebGL/Canvas (falls Websites nutzen)
    - Video-Decoding (falls Videos laufen)
    - Compositing aller Layer
  - **Typische Consumer-GPU (z. B. Intel UHD/iGPU):** VRAM-Limit bei 6× Fullscreen
  - **iGPU (Intel/AMD):** Teilen sich RAM mit System → häufig nur 512MB-2GB VRAM
- **Test:** GPU-Nutzung in Task Manager → "GPU Engine" Spalte, VRAM-Nutzung

**2. Chromium Renderer-Prozess Overhead (6+ Prozesse)**
- **Wahrscheinlichkeit:** 80%
- **Begründung:**
  - Jedes BrowserWindow = 1 Renderer-Prozess (isoliert)
  - 6 Displays = **mind. 6 Renderer-Prozesse + 1 Main = 7 Prozesse**
  - Jeder Renderer:
    - Lädt vollständige Chromium-Runtime (~100-200MB RAM pro Prozess)
    - JS-Engine (V8)
    - Rendering-Pipeline
    - Netzwerk-Stack (DNS, HTTP/2, WebSocket)
  - **Bei heavy Websites:** Je Renderer zusätzlich 200-500MB RAM
  - **Total:** 6× (200-700MB) = **1.2-4.2GB RAM nur für Renderer**
- **Test:** Task Manager → Details → Memory pro TTQuotes-Prozess summieren

**3. Website-Last (JS/Ajax/Video/Live-Updates)**
- **Wahrscheinlichkeit:** 75%
- **Begründung:**
  - Websites wie `shop.tiptorro.com/livescoretv` = Live-Score-Updates
  - **Heavy JavaScript:** Regelmäßige DOM-Updates, WebSocket-Polling
  - **Werbung/Tracking:** Zusätzliche Scripts, Third-Party-Requests
  - **Video/Livestreams:** Falls vorhanden → zusätzliche Decode-Last
  - **Multiplikator-Effekt:** 6× parallele Netzwerk-Requests, 6× JS-Execution
- **Test:** Chrome DevTools → Network/Performance Tab pro Display-Fenster

---

#### **🟡 MITTEL: Wahrscheinlich (50-70%)**

**4. CPU-Limit durch Compositing/Rasterization**
- **Wahrscheinlichkeit:** 60%
- **Begründung:**
  - Chromium nutzt auch CPU für Rasterization (falls GPU voll)
  - Multi-Monitor Setup = OS muss **Desktop Composing** für alle Displays machen
  - Windows Desktop Window Manager (DWM) = zusätzlicher Overhead
  - **iGPU:** Teilen sich CPU/GPU-Resources → bei hoher GPU-Last → CPU-Fallback
- **Test:** Task Manager → CPU % → alle TTQuotes-Prozesse + "Desktop Window Manager"

**5. RefreshManager Timer-Overhead (setInterval 1s)**
- **Wahrscheinlichkeit:** 40%
- **Begründung:**
  - `RefreshManager.startCoordinatedRefresh()` läuft alle **1 Sekunde**
  - Prüft alle 6 Fenster → `Date.now()` + Array-Iteration
  - Bei 6 Displays = 6 Checks pro Sekunde (minimal, aber kumulativ)
  - **Kritischer:** Bei Refresh → `executeJavaScript()` + `safeLoadUrl()` → 6× parallele Reloads
  - **Overlay-Logik:** `executeJavaScript` pro Fenster = IPC-Overhead
- **Test:** Logging der RefreshManager-Interval-Dauer

**6. Speicherleck / steigende RAM-Nutzung**
- **Wahrscheinlichkeit:** 50%
- **Begründung:**
  - Chromium kann bei vielen Tabs/Fenstern Memory-Leaks haben
  - `liveWindows` Array wird nicht immer korrekt bereinigt (siehe `main.js` → teilweise `forEach(win => { try { win.destroy(); } catch {} })`)
  - `refreshManager.windows` Array wächst möglicherweise (Cleanup-Check erforderlich)
- **Test:** Performance Monitor → Memory-Trend über 1-2 Stunden

---

#### **🟢 NIEDRIG: Weniger wahrscheinlich (<50%)**

**7. UI-Overhead (Hover-Effekte/Animationen)**
- **Wahrscheinlichkeit:** 20-30%
- **Begründung:**
  - **Nur 1 Config-Fenster** (Primär-Monitor), nicht 6×
  - Hover-Effekte in `style.css`:
    ```css
    .display-section:hover {
      transform: scale(1.003) translateZ(0);  /* GPU-Layer */
      box-shadow: 0 0 15px #26994755;         /* GPU-Expensive */
      will-change: transform, box-shadow;
    }
    ```
  - **Impact:** Nur wenn Config-UI aktiv ist (während Live-Views läuft → UI geschlossen)
  - **Während Live-Views:** Config-Fenster geschlossen → **kein Hover-Overhead**
- **Fazit:** **Kann NICHT die Hauptursache sein**, da UI nicht während Live-Views aktiv ist

**8. Netzwerk-Bandbreite (6× parallele Requests)**
- **Wahrscheinlichkeit:** 30%
- **Begründung:**
  - 6× parallele HTTP-Requests (Initial-Load + Polling)
  - **Typische Bandbreite:** 100 Mbps+ → sollte ausreichen für 6 Websites
  - **Aber:** Bei Video-Streams → 6× 5-10 Mbps = 30-60 Mbps → noch machbar
- **Test:** Resource Monitor → Network → Bytes/s pro TTQuotes-Prozess

**9. Multi-Monitor Bandwidth/Refresh-Rate/Resolution**
- **Wahrscheinlichkeit:** 40%
- **Begründung:**
  - **Display-Port/HDMI Bandwidth:** Bei 4K @ 60Hz = 14.4 Gbps pro Display
  - Bei 6× 1080p @ 60Hz = ~2.8 Gbps pro Display = **16.8 Gbps total**
  - **Typische GPU:** Max. 3-4 Displays über DisplayPort, Rest über HDMI (begrenzt)
  - **Aber:** 1920×1080 @ 60Hz ist relativ niedrig → eher nicht das Limit
- **Test:** GPU-Info (GPU-Z, Task Manager) → Display-Bandwidth-Usage

---

### **1.2. Antwort: Kann es an Hover-Effekten liegen?**

**NEIN, sehr unwahrscheinlich (20-30% Wahrscheinlichkeit).**

**Begründung:**
1. **Config-UI ist nur beim Setup aktiv:** Sobald Live-Views gestartet sind, wird `configWindow.close()` aufgerufen (siehe `main.js:492`). Die Hover-Effekte laufen nur auf dem Config-Fenster, das während der Live-Ansicht **geschlossen** ist.
2. **Impact ist minimal:** Selbst wenn UI offen wäre:
   - Nur 1 Renderer-Prozess für Config-UI
   - Hover-Effekte nutzen GPU-Compositing (effizient)
   - `transform: scale(1.003)` = minimale Änderung
   - `will-change` optimiert für GPU-Layer
3. **Typischer Performance-Bottleneck bei Multi-Monitor:**
   - **GPU/VRAM-Limit** (6× Fullscreen-Rendering)
   - **Renderer-Prozess-Overhead** (6× Chromium-Runtime)
   - **Website-Last** (6× parallele JS/Network)
   - **NICHT:** UI-Hover-Effekte (nur 1 Fenster, nicht 6)

**Empfehlung:** Hover-Effekte können als **Quick Win** optimiert werden (siehe Maßnahmen), aber sie sind **nicht die Hauptursache** für Performance-Probleme bei 6+ Displays.

---

## 2. Mess- und Prüfplan (Schritt-für-Schritt)

### **2.1. Metriken, die gemessen werden müssen**

#### **A. Hardware-Metriken (OS-Level)**
| Metrik | Tool | Akzeptanzkriterium |
|--------|------|-------------------|
| **CPU % (gesamt)** | Task Manager → Performance | < 80% (Durchschnitt) |
| **CPU % (pro Prozess)** | Task Manager → Details → CPU | Main: < 10%, Renderer: < 15% pro Prozess |
| **RAM (gesamt)** | Task Manager → Memory | < 70% System-RAM |
| **RAM (pro Prozess)** | Task Manager → Details → Memory | Main: < 200MB, Renderer: < 500MB pro Prozess |
| **GPU % (3D)** | Task Manager → Performance → GPU | < 90% |
| **GPU % (Video Decode)** | Task Manager → Performance → GPU | < 80% (falls Videos) |
| **VRAM (dedicated)** | GPU-Z / Task Manager → GPU Details | < 90% VRAM |
| **VRAM (shared/system)** | GPU-Z / Task Manager | < 70% shared |
| **GPU Engine (per Prozess)** | Task Manager → Details → "GPU Engine" Spalte | Alle Renderer sollten gleiche Engine nutzen |
| **Disk I/O** | Resource Monitor → Disk | < 80% (falls viel Page-File) |
| **Network Bandwidth** | Resource Monitor → Network | < 50% verfügbare Bandbreite |

#### **B. Anwendungs-Metriken (Electron/Chromium)**
| Metrik | Tool/Methode | Akzeptanzkriterium |
|--------|--------------|-------------------|
| **FPS (Frames per Second)** | Chromium DevTools → Performance → FPS | ≥ 55 FPS (keine Frame-Drops) |
| **Frame-Drops** | Chromium DevTools → Performance → Frames | < 5% Frame-Drops |
| **Memory Leak Trend** | Performance Monitor → Custom Counter (TTQuotes Memory) | Kein kontinuierlicher Anstieg über 2h |
| **JS Heap Size** | Chromium DevTools → Memory → Heap Snapshot | < 100MB pro Renderer |
| **Renderer-Prozess-Anzahl** | Task Manager → Details → Filtern nach "TTQuotes.exe" | = Anzahl Displays + 1 (Main) |
| **Handle Count (per Prozess)** | Process Explorer / Task Manager → Details → Handles | < 10.000 pro Prozess |
| **Thread Count (per Prozess)** | Task Manager → Details → Threads | Main: < 20, Renderer: < 30 |

#### **C. Funktions-Metriken (App-spezifisch)**
| Metrik | Tool/Methode | Akzeptanzkriterium |
|--------|--------------|-------------------|
| **RefreshManager Interval-Dauer** | Logging (`console.time()` in `RefreshManager.js`) | < 50ms pro Interval-Check |
| **Window Creation Time** | `PerformanceMonitor.trackWindowCreation()` | < 2 Sekunden pro Fenster |
| **URL Load Time** | `safeLoadUrl()` Logging | < 5 Sekunden pro URL |
| **Overlay Show/Hide Duration** | `executeJavaScript()` Timing | < 100ms |

---

### **2.2. Tools & Setup**

#### **A. Windows-integrierte Tools (sofort verfügbar)**
1. **Task Manager (Details-Ansicht)**
   - Spalten aktivieren: CPU, Memory, GPU, GPU Engine, Handles, Threads
   - Prozesse filtern: `TTQuotes.exe`, `Desktop Window Manager`
   - **Dauer:** 5-10 Minuten Baseline, dann bei 6 Displays

2. **Resource Monitor (resmon.exe)**
   - CPU, Memory, Disk, Network Tabs
   - **Dauer:** Parallel zu Task Manager laufen lassen

3. **Performance Monitor (perfmon.exe)**
   - Custom Counter: "Process → Private Bytes → TTQuotes.exe" (alle Instanzen)
   - **Dauer:** 1-2 Stunden Trend-Aufzeichnung

#### **B. Chromium DevTools (pro Renderer-Fenster)**
1. **DevTools öffnen** (während Live-Views):
   ```javascript
   // In main.js temporär hinzufügen:
   win.webContents.openDevTools(); // Nur für Tests!
   ```
2. **Performance Tab:**
   - Record starten (5 Minuten)
   - FPS, Frame-Drops, Main-Thread-Auslastung analysieren
3. **Memory Tab:**
   - Heap Snapshot vor/nach 1h Laufzeit
   - Memory-Leak-Check

#### **C. GPU-spezifische Tools (optional, empfohlen)**
1. **GPU-Z** (kostenlos)
   - VRAM-Nutzung, GPU-Load, Temperatur
   - **Dauer:** Kontinuierlich während Tests

2. **Windows GPU-Engine Anzeige:**
   - Task Manager → Details → Spalte "GPU Engine" aktivieren
   - Zeigt, welche GPU-Engine (3D, Video Decode, Copy) genutzt wird

#### **D. ETW/PerfView (für detaillierte Profiling, optional)**
- **PerfView.exe** (Microsoft, kostenlos)
- ETW-Traces für Chromium-Rendering-Pipeline
- **Aufwand:** Höher, nur bei tiefergehender Analyse nötig

---

### **2.3. Test-Szenarien (Schritt-für-Schritt)**

#### **Test 1: Baseline (1 Display)**
1. **Setup:** 1 Display konfiguriert, einfache Website (z. B. `about:blank` oder statische HTML)
2. **Messung:** 5 Minuten
3. **Metriken:** CPU, RAM, GPU, FPS (DevTools)
4. **Akzeptanzkriterium:** 
   - CPU < 10%, RAM < 500MB, GPU < 20%, FPS ≥ 58
5. **Ergebnis dokumentieren:** Baseline-Werte für Vergleich

#### **Test 2: Skalierungstest (2 → 3 → 4 → 5 → 6 Displays)**
1. **Setup:** Schrittweise Displays hinzufügen (gleiche einfache Website)
2. **Messung:** 5 Minuten pro Konfiguration
3. **Metriken:** CPU, RAM, GPU, VRAM, FPS (pro Display)
4. **Akzeptanzkriterium:**
   - CPU < 80%, RAM < 70% System, GPU < 90%, FPS ≥ 55 (alle Displays)
5. **Breakpoint identifizieren:** Bei welcher Display-Anzahl werden Kriterien verletzt?

#### **Test 3: Website-Last-Vergleich (6 Displays)**
1. **Variante A:** Leere Seite (`about:blank`)
2. **Variante B:** Statische HTML-Seite (minimal JS)
3. **Variante C:** Produktive Website (z. B. `shop.tiptorro.com/livescoretv`)
4. **Variante D:** Heavy Website (mit Video, Werbung, WebSocket)
5. **Messung:** 10 Minuten pro Variante
6. **Akzeptanzkriterium:** Variante C/D sollten noch < 90% GPU/CPU halten
7. **Ergebnis:** Identifiziere, ob Website-Last oder Hardware-Limit der Bottleneck ist

#### **Test 4: Hover-Effekt-Test (UI während Live-Views)**
1. **Setup:** 6 Displays aktiv, Config-UI öffnen (ESC-Taste)
2. **Aktion:** Hover über `.display-section` Elemente (schnell nacheinander)
3. **Messung:** CPU/GPU während Hover vs. ohne Hover
4. **Akzeptanzkriterium:** Hover-Overhead < 5% CPU/GPU
5. **Ergebnis:** Bestätigt, dass Hover-Effekte nicht Hauptursache sind

#### **Test 5: RefreshManager-Overhead (6 Displays)**
1. **Setup:** 6 Displays, RefreshManager aktiv
2. **Messung:** Interval-Dauer loggen (`console.time()`)
3. **Aktion:** Refresh-Event manuell triggern (alle 6 Fenster gleichzeitig)
4. **Akzeptanzkriterium:** Interval-Check < 50ms, Refresh-Dauer < 5 Sekunden (alle 6)
5. **Ergebnis:** Identifiziere, ob koordinierte Refreshes Bottleneck sind

#### **Test 6: Auflösung/Refresh-Rate-Variation (6 Displays)**
1. **Variante A:** 1920×1080 @ 60Hz (Standard)
2. **Variante B:** 1920×1080 @ 30Hz (reduziert)
3. **Variante C:** 1280×720 @ 60Hz (niedrigere Auflösung)
4. **Messung:** GPU/VRAM-Nutzung pro Variante
5. **Akzeptanzkriterium:** Variante B/C sollten GPU < 80% halten
6. **Ergebnis:** Identifiziere, ob Auflösung/Refresh-Rate optimierbar ist

#### **Test 7: Hardware-Acceleration ON/OFF (6 Displays)**
1. **Variante A:** Hardware-Acceleration AN (Standard)
2. **Variante B:** Hardware-Acceleration AUS (`app.disableHardwareAcceleration()`)
3. **Messung:** CPU/GPU/RAM pro Variante
4. **Akzeptanzkriterium:** Variante A sollte GPU nutzen, Variante B sollte CPU erhöhen
5. **Ergebnis:** Bestätigt, ob GPU-Limit oder CPU-Limit der Bottleneck ist

---

### **2.4. Akzeptanzkriterien (Zusammenfassung)**

Ein Test ist **"bestanden"**, wenn:
- ✅ CPU < 80% (Durchschnitt, alle Prozesse)
- ✅ RAM < 70% System-RAM
- ✅ GPU < 90% (3D + Video Decode)
- ✅ VRAM < 90% (dedicated + shared)
- ✅ FPS ≥ 55 (alle Displays, keine Frame-Drops > 5%)
- ✅ Kein kontinuierlicher Memory-Leak über 2h
- ✅ Renderer-Prozess-Anzahl = Display-Anzahl + 1 (Main)
- ✅ Window Creation Time < 2s pro Fenster
- ✅ RefreshManager Interval < 50ms

**"Nicht bestanden"** → Maßnahmen aus Abschnitt 4 umsetzen, dann erneut testen.

---

## 3. Funktionsreview (Ganzheitliche Bewertung)

### **3.1. Positives (Stärken)**

#### **Architektur & Code-Qualität**
- ✅ **Modularer Aufbau:** Klare Trennung (WindowManager, DisplayService, RefreshManager)
- ✅ **Singleton-Pattern:** `refreshManagerSingleton.js` verhindert Duplikate
- ✅ **Event-Driven:** Monitor-Service nutzt EventEmitter (reaktiv)
- ✅ **Error Handling:** Try-Catch-Blocks vorhanden, `ErrorHandler` Modul
- ✅ **Logging:** Strukturiertes Logging mit Winston, Rotation vorhanden
- ✅ **Type Safety (teilweise):** Kommentare/Validierung für Config-Format

#### **Stabilität & Recovery**
- ✅ **Health Check System:** `HealthCheckManager` vorhanden
- ✅ **Performance Monitoring:** `PerformanceMonitor` misst RAM/CPU
- ✅ **Auto-Reload:** RefreshManager mit koordinierten Refreshes (verhindert gleichzeitige Reloads)
- ✅ **Window Cleanup:** WindowManager mit `cleanup()` Methode
- ✅ **Safe URL Loading:** `safeload.js` mit Fehlerbehandlung

#### **Sicherheit**
- ✅ **Context Isolation:** `contextIsolation: true` überall
- ✅ **Node Integration deaktiviert:** `nodeIntegration: false`
- ✅ **CSP vorhanden:** Content-Security-Policy in `index.html`
- ✅ **URL-Allowlist:** `allowlist.js` Modul vorhanden
- ✅ **Session Hardening:** `security.js` mit `hardenSession()`

#### **Multi-Monitor Handling**
- ✅ **Display-Events:** Screen-Events (display-added/removed) werden behandelt
- ✅ **Monitor-Service:** Automatisches Parken/Unparken bei Display-Hotplug
- ✅ **Persistenz:** Window-Layout wird gespeichert (`window-layout.json`)
- ✅ **Identity-basiertes Remapping:** Fenster werden per URL-Identity zugeordnet

#### **UX & Features**
- ✅ **Notausstieg:** ESC-Taste + Overlay-Button
- ✅ **Auto-Start:** Auto-Launch integriert
- ✅ **Favoriten-System:** Schnellzugriff auf häufige URLs
- ✅ **Erweiterte Einstellungen:** ExtendedConfig für Refresh-Delays
- ✅ **Performance Dashboard:** UI für Metriken vorhanden

---

### **3.2. Negatives (Schwächen & Risiken)**

#### **Performance & Skalierung (KRITISCH)**
- ❌ **Keine GPU-Optimierung:** Hardware-Acceleration nicht konfigurierbar
- ❌ **Keine FPS-Limiter:** Alle Displays rendern unbegrenzt (auch wenn nicht sichtbar)
- ❌ **Background Throttling deaktiviert:** Alle Fenster laufen immer (auch geparkt)
- ❌ **Keine adaptive Rendering-Strategie:** Keine Reduktion für nicht-aktive Displays
- ❌ **RefreshManager Interval 1s:** Zu häufig für 6+ Displays (Overhead)
- ❌ **Koordinierte Refreshes:** Alle 6 Fenster können gleichzeitig reloaden → GPU-Spitze
- ❌ **Keine VRAM-Überwachung:** PerformanceMonitor misst nur RAM/CPU, nicht GPU/VRAM

#### **Architektur & Skalierung**
- ⚠️ **Prozess-Modell:** 1 Renderer pro Display (nicht optimiert für 6+)
  - **Besser:** Renderer-Pooling oder Shared-Renderer (komplexer Umbau)
- ⚠️ **liveWindows Array:** Wird manchmal nicht korrekt bereinigt (`main.js:225, 453`)
- ⚠️ **RefreshManager.windows:** Keine automatische Bereinigung bei zerstörten Fenstern
- ⚠️ **Monitor-Service Debounce:** 400ms Debounce kann zu langsam sein bei schnellen Display-Änderungen

#### **Stabilität & Edge-Cases**
- ⚠️ **Crash-Recovery fehlt:** Kein automatischer Neustart bei Renderer-Crash
- ⚠️ **Watchdog fehlt:** Keine Überwachung, ob Renderer hängen bleiben
- ⚠️ **Memory-Leak-Risiko:** Chromium kann bei vielen Fenstern leaken (nicht überwacht)
- ⚠️ **Handle-Leak-Risiko:** Keine Überwachung der Handle-Count (kann zu "Out of Handles" führen)

#### **Fehlertoleranz**
- ⚠️ **Network-Fehler:** `safeLoadUrl()` fängt Fehler ab, aber kein Retry-Mechanismus
- ⚠️ **Display-Fehler:** Bei Display-Removal werden Fenster geparkt, aber kein Fallback auf Primär
- ⚠️ **Config-Fehler:** Ungültige URLs werden abgefangen, aber kein User-Feedback

#### **Logging & Debugging**
- ⚠️ **Performance-Logging unvollständig:** Keine GPU/VRAM/FPS-Logs
- ⚠️ **Refresh-Logging fehlt:** RefreshManager loggt nicht Dauer pro Refresh
- ⚠️ **Window-Event-Logging:** Teilweise fehlend (z. B. Window-Creation-Dauer)

#### **Konfigurationsmanagement**
- ⚠️ **Keine GPU-Konfiguration:** Hardware-Acceleration nicht konfigurierbar
- ⚠️ **Keine FPS-Konfiguration:** Keine Option für FPS-Limit (z. B. 30fps für nicht-aktive Displays)
- ⚠️ **Keine Adaptive-Rendering-Konfiguration:** Keine Option für niedrigeres Rendering bei Hintergrund

#### **Multi-Monitor Edge-Cases**
- ⚠️ **Display-Scaling:** Windows-Scaling (125%, 150%) nicht explizit behandelt
- ⚠️ **Display-Rotation:** Rotation wird nicht getestet/validiert
- ⚠️ **Display-Reihenfolge:** Monitor-Index kann sich ändern (ID-basiert wäre besser, teilweise vorhanden)

#### **Code-Qualität (Minor)**
- ⚠️ **Veraltete Patterns:** `liveWindows` Array wird noch genutzt (sollte durch WindowManager ersetzt werden)
- ⚠️ **Code-Duplikation:** Fenster-Erstellung in `main.js` dupliziert (Google Slides vs. Standard)
- ⚠️ **Magic Numbers:** Refresh-Delays hardcoded (z. B. `refreshDelay: liveWindows.length * 1000`)

---

### **3.3. Kritikpunkte (Explizite Risiken)**

#### **🔴 KRITISCH: Skalierungsproblem bei 6+ Displays**
- **Problem:** 1 Renderer-Prozess pro Display = exponentieller Overhead
- **Risiko:** Bei 10 Displays = 10× Chromium-Runtime = 2-5GB RAM + GPU-Limit
- **Empfehlung:** Renderer-Pooling oder Shared-Renderer (großer Umbau)

#### **🔴 KRITISCH: GPU/VRAM-Limit nicht überwacht**
- **Problem:** Keine GPU/VRAM-Metriken im PerformanceMonitor
- **Risiko:** System stürzt ab oder wird extrem langsam, ohne dass App es merkt
- **Empfehlung:** GPU-Monitoring hinzufügen (Windows-APIs oder externe Tools)

#### **🟡 MITTEL: RefreshManager kann GPU-Spitzen verursachen**
- **Problem:** Koordinierte Refreshes = alle 6 Fenster reloaden gleichzeitig
- **Risiko:** GPU-Spitze bei Reload (Compositing + Re-Rendering)
- **Empfehlung:** Staggered Refreshes (1 Fenster alle 5 Sekunden statt alle gleichzeitig)

#### **🟡 MITTEL: Background Throttling deaktiviert**
- **Problem:** Alle Fenster laufen immer, auch wenn geparkt/nicht sichtbar
- **Risiko:** CPU/GPU-Verschwendung bei geparkten Fenstern
- **Empfehlung:** Adaptive Background Throttling (aktiv für geparkte, deaktiviert für sichtbare)

#### **🟢 NIEDRIG: Memory-Leak-Risiko**
- **Problem:** Chromium kann bei vielen Fenstern leaken (bekanntes Problem)
- **Risiko:** RAM steigt über Stunden kontinuierlich
- **Empfehlung:** Watchdog + Auto-Reload bei hohem RAM-Verbrauch

---

## 4. Stabilitäts- und Skalierungsmaßnahmen (Priorisiert)

### **4.1. Quick Wins (Niedrige Umsetzung, Hoher Impact)**

#### **1. GPU/VRAM-Monitoring hinzufügen** ⚡ (Impact: Hoch, Aufwand: Mittel)
```javascript
// modules/PerformanceMonitor.js erweitern
// Windows-APIs für GPU-Nutzung (WMI oder externe Tools)
// Alternative: Externe GPU-Z Integration
```
- **Impact:** Identifiziert GPU-Limit sofort
- **Aufwand:** 4-8 Stunden (Windows-APIs integrieren)
- **Priorität:** **P0 (Kritisch)**

#### **2. RefreshManager Interval optimieren** ⚡ (Impact: Mittel, Aufwand: Niedrig)
```javascript
// modules/RefreshManager.js
// Statt 1s Interval → 5s Interval für 6+ Displays
this.interval = setInterval(() => {
    // ...
}, this.windows.length > 5 ? 5000 : 1000);
```
- **Impact:** Reduziert CPU-Overhead um ~80% bei 6+ Displays
- **Aufwand:** 1 Stunde
- **Priorität:** **P1 (Hoch)**

#### **3. Staggered Refreshes (nicht alle gleichzeitig)** ⚡ (Impact: Hoch, Aufwand: Niedrig)
```javascript
// modules/RefreshManager.js
// Statt alle 6 gleichzeitig → 1 alle 5 Sekunden
refreshWindow(windowData, staggerDelay = 0) {
    setTimeout(() => {
        // Refresh-Logik
    }, staggerDelay);
}
```
- **Impact:** GPU-Spitzen reduzieren (6× Reloads verteilt über 30s statt sofort)
- **Aufwand:** 2-3 Stunden
- **Priorität:** **P1 (Hoch)**

#### **4. Hover-Effekte optimieren (CSS only, reduce motion)** ⚡ (Impact: Niedrig, Aufwand: Sehr niedrig)
```css
/* style.css */
@media (prefers-reduced-motion: reduce) {
    .display-section:hover {
        transform: none; /* Kein Scale */
        transition: none; /* Keine Animation */
    }
}
/* Oder: will-change entfernen, wenn nicht hovered */
.display-section:not(:hover) {
    will-change: auto;
}
```
- **Impact:** Minimal (nur bei Config-UI), aber Quick Win
- **Aufwand:** 30 Minuten
- **Priorität:** **P3 (Niedrig)**

---

### **4.2. Mittlere Maßnahmen (Mittlerer Aufwand, Hoher Impact)**

#### **5. Adaptive Background Throttling** ⚡⚡ (Impact: Hoch, Aufwand: Mittel)
```javascript
// modules/displays.js / WindowManager.js
// Background Throttling nur für geparkte/versteckte Fenster
if (win.isVisible()) {
    win.webContents.setBackgroundThrottling(false); // Sichtbar = immer aktiv
} else {
    win.webContents.setBackgroundThrottling(true); // Versteckt = throttlen
}
// Event-Listener für Visibility-Änderungen
win.on('show', () => win.webContents.setBackgroundThrottling(false));
win.on('hide', () => win.webContents.setBackgroundThrottling(true));
```
- **Impact:** Reduziert CPU/GPU bei geparkten Fenstern um ~50%
- **Aufwand:** 4-6 Stunden (Event-Handling + Tests)
- **Priorität:** **P1 (Hoch)**

#### **6. FPS-Limiter für nicht-aktive Displays** ⚡⚡ (Impact: Mittel, Aufwand: Mittel)
```javascript
// Chromium-Feature: --max-gum-fps oder JS-basiert
// Alternative: requestAnimationFrame throttling
// Oder: Windows-API für Display-Refresh-Rate (nur für App-Fenster)
```
- **Impact:** Reduziert GPU-Last bei Hintergrund-Displays
- **Aufwand:** 6-8 Stunden (Chromium-Flags + Tests)
- **Priorität:** **P2 (Mittel)**

#### **7. Hardware-Acceleration konfigurierbar machen** ⚡⚡ (Impact: Hoch, Aufwand: Mittel)
```javascript
// main.js
// ExtendedConfig erweitern: hardwareAcceleration: true/false
if (config.hardwareAcceleration === false) {
    app.disableHardwareAcceleration(); // VOR app.whenReady()
}
```
- **Impact:** Fallback bei GPU-Limit (CPU-Rendering)
- **Aufwand:** 3-4 Stunden (Config + Tests)
- **Priorität:** **P1 (Hoch)**

#### **8. Memory-Leak-Überwachung + Auto-Reload** ⚡⚡ (Impact: Hoch, Aufwand: Mittel)
```javascript
// modules/PerformanceMonitor.js
// Trend-Analyse: Wenn RAM über 2h um > 500MB steigt → Memory-Leak
// Auto-Reload bei > 3GB RAM (pro Renderer)
if (metrics.memory.heapUsed > 3000) {
    this.emit('memory-leak-detected', metrics);
    // Auto-Reload aller Fenster
}
```
- **Impact:** Verhindert RAM-Overflow-Crashes
- **Aufwand:** 6-8 Stunden (Trend-Analyse + Auto-Reload)
- **Priorität:** **P2 (Mittel)**

---

### **4.3. Größere Umbauten (Hoher Aufwand, Sehr hoher Impact)**

#### **9. Renderer-Pooling (Shared-Renderer)** ⚡⚡⚡ (Impact: Sehr hoch, Aufwand: Sehr hoch)
```javascript
// Statt 1 Renderer pro Display → Shared-Renderer-Pool
// z. B. 2 Renderer für 6 Displays (je 3 Displays pro Renderer)
// Oder: 1 Renderer mit mehreren BrowserViews (komplexer)
```
- **Impact:** Reduziert RAM um ~50-70%, CPU-Overhead um ~40%
- **Aufwand:** 20-40 Stunden (Architektur-Umbau + Tests)
- **Priorität:** **P2 (Mittel, nur bei > 8 Displays nötig)**

#### **10. Watchdog + Crash-Recovery** ⚡⚡⚡ (Impact: Hoch, Aufwand: Hoch)
```javascript
// modules/WatchdogManager.js
// Überwacht Renderer-Prozesse, erkennt Hänger/Crashes
// Auto-Reload bei Crash, Auto-Restart bei wiederholten Crashes
```
- **Impact:** Höhere Stabilität, automatische Recovery
- **Aufwand:** 12-16 Stunden (Watchdog + Tests)
- **Priorität:** **P2 (Mittel)**

#### **11. Virtualization für Config-UI** ⚡⚡⚡ (Impact: Niedrig, Aufwand: Mittel)
```javascript
// Nur sichtbare Display-Cards rendern (React/Vue Virtualization)
// Reduziert DOM-Nodes bei 10+ Displays
```
- **Impact:** Nur relevant bei 10+ Displays, minimal
- **Aufwand:** 8-12 Stunden (Framework-Integration)
- **Priorität:** **P3 (Niedrig)**

---

### **4.4. Priorisierungs-Matrix**

| Maßnahme | Impact | Aufwand | Priorität | Empfohlene Reihenfolge |
|----------|--------|---------|-----------|------------------------|
| GPU/VRAM-Monitoring | Hoch | Mittel | P0 | **1. Sofort** |
| RefreshManager Interval | Mittel | Niedrig | P1 | **2. Quick Win** |
| Staggered Refreshes | Hoch | Niedrig | P1 | **3. Quick Win** |
| Adaptive Background Throttling | Hoch | Mittel | P1 | **4. Nächste Woche** |
| Hardware-Acceleration Config | Hoch | Mittel | P1 | **5. Parallel zu #4** |
| Memory-Leak-Überwachung | Hoch | Mittel | P2 | **6. Nach Quick Wins** |
| FPS-Limiter | Mittel | Mittel | P2 | **7. Optional** |
| Renderer-Pooling | Sehr hoch | Sehr hoch | P2 | **8. Nur bei > 8 Displays** |
| Watchdog | Hoch | Hoch | P2 | **9. Langfristig** |
| Hover-Optimierung | Niedrig | Sehr niedrig | P3 | **10. Nice-to-have** |

---

### **4.5. Risiken & mögliche Regressionen**

#### **Risiko 1: Hardware-Acceleration deaktivieren**
- **Risiko:** CPU-Last steigt drastisch (50-100% mehr)
- **Mitigation:** Nur als Fallback aktivieren, wenn GPU > 90%
- **Test:** CPU-Monitoring während Tests

#### **Risiko 2: Background Throttling aktivieren**
- **Risiko:** Websites können bei geparkten Fenstern einfrieren (JS pausiert)
- **Mitigation:** Nur für wirklich versteckte Fenster (nicht für minimierte)
- **Test:** Website-Updates testen nach Unpark

#### **Risiko 3: Staggered Refreshes**
- **Risiko:** Websites können 30s versetzt aktualisieren (UX-Problem bei Live-Daten)
- **Mitigation:** Nur für nicht-kritische Websites, kritische (Live-Scores) synchron
- **Test:** User-Feedback zu Update-Verzögerung

#### **Risiko 4: Renderer-Pooling**
- **Risiko:** Ein Renderer-Crash = mehrere Displays betroffen
- **Mitigation:** Isolierte Renderer pro kritischem Display, Pooling nur für statische
- **Test:** Crash-Tests mit isolierten Renderern

---

## 5. Zusammenfassung & Empfehlungen

### **Hauptursache (wahrscheinlich):**
1. **GPU/VRAM-Limit** (85% Wahrscheinlichkeit) → 6× Fullscreen-Rendering überlastet GPU
2. **Renderer-Prozess-Overhead** (80% Wahrscheinlichkeit) → 6× Chromium-Runtime = 2-4GB RAM
3. **Website-Last** (75% Wahrscheinlichkeit) → 6× parallele JS/Network-Requests

### **Hover-Effekte sind NICHT die Hauptursache:**
- Config-UI ist während Live-Views geschlossen
- Impact ist minimal (nur 1 Fenster)
- **Aber:** Als Quick Win optimierbar (30 Min Aufwand)

### **Sofortige Maßnahmen (diese Woche):**
1. ✅ **GPU/VRAM-Monitoring implementieren** (Identifiziert Bottleneck)
2. ✅ **RefreshManager Interval optimieren** (1s → 5s bei 6+ Displays)
3. ✅ **Staggered Refreshes** (verhindert GPU-Spitzen)

### **Nächste Schritte (nächste 2 Wochen):**
4. ✅ **Adaptive Background Throttling** (reduziert Overhead bei geparkten Fenstern)
5. ✅ **Hardware-Acceleration konfigurierbar** (Fallback bei GPU-Limit)
6. ✅ **Memory-Leak-Überwachung** (verhindert RAM-Overflow)

### **Langfristig (bei > 8 Displays):**
7. ✅ **Renderer-Pooling** (großer Umbau, aber sehr effektiv)
8. ✅ **Watchdog + Crash-Recovery** (höhere Stabilität)

---

## 6. Offene Fragen (für weitere Analyse)

### **Benötigte Informationen (falls verfügbar):**
1. **Hardware-Spezifikationen:**
   - CPU-Modell (z. B. Intel i5-10400, AMD Ryzen 5 5600G)
   - GPU-Modell (z. B. Intel UHD 630, NVIDIA GTX 1050, AMD RX 550)
   - RAM-Größe (z. B. 16GB, 32GB)
   - VRAM-Größe (dedicated + shared)

2. **Display-Konfiguration:**
   - Anzahl Displays (aktuell getestet: 6?)
   - Auflösung pro Display (1920×1080? 4K?)
   - Refresh-Rate (60Hz? 30Hz?)
   - Windows-Scaling (100%? 125%? 150%?)

3. **Website-Charakteristika:**
   - Welche Websites werden angezeigt? (z. B. `shop.tiptorro.com/livescoretv`)
   - Enthalten sie Video/Livestreams?
   - Enthalten sie Heavy JavaScript/WebSocket-Updates?
   - Enthalten sie Werbung/Third-Party-Scripts?

4. **Aktuelle Performance-Metriken (falls gemessen):**
   - CPU % bei 6 Displays
   - RAM % bei 6 Displays
   - GPU % bei 6 Displays (falls verfügbar)
   - FPS bei 6 Displays (falls gemessen)

---

**Ende der Analyse**


