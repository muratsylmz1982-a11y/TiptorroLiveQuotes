# RefreshManager - Aktuelle Standardwerte

**Stand:** Analyse vom Code (RefreshManager.js, ExtendedConfig.js)

---

## 📊 Standardwerte (Hardcoded in RefreshManager.js)

### **refreshDelay** (Refresh-Intervall)
- **Standardwert:** `1200000` ms = **20 Minuten**
- **Bedeutung:** Wie oft jedes Fenster neu geladen wird
- **Konfigurierbar:** ✅ Ja (über ExtendedConfig)
- **Quelle:** `RefreshManager.js:13`

### **overlayDelay** (Overlay-Anzeigedauer)
- **Standardwert:** `3500` ms = **3,5 Sekunden**
- **Bedeutung:** Wie lange das Overlay angezeigt wird, bevor die Seite neu geladen wird
- **Konfigurierbar:** ✅ Ja (über ExtendedConfig)
- **Quelle:** `RefreshManager.js:14`

### **Interval-Check** (Koordinierungs-Intervall)
- **Standardwert:** `1000` ms = **1 Sekunde**
- **Bedeutung:** Wie oft geprüft wird, ob ein Fenster neu geladen werden muss
- **Konfigurierbar:** ❌ Nein (hardcoded in `startCoordinatedRefresh()`)
- **Quelle:** `RefreshManager.js:51`
- **⚠️ Performance-Problem:** Bei 6+ Displays wird alle 1 Sekunde geprüft

---

## 📋 ExtendedConfig Standardwerte

Die Standardwerte werden auch in `ExtendedConfig.js` definiert:

```javascript
refresh: {
    intervalMs: 1200000,        // 20 Minuten (wie RefreshManager)
    overlayMinTimeMs: 3500,     // 3,5 Sekunden (wie RefreshManager)
    retryDelayMs: 1000,         // 1 Sekunde (für Retries)
    enabled: true
}
```

**Quelle:** `ExtendedConfig.js:11-16`

---

## 🔄 Konfigurationsfluss

1. **RefreshManager wird erstellt** → Standardwerte (20 Min, 3,5 Sek)
2. **ExtendedConfig lädt Konfiguration** → Werte werden überschrieben (falls vorhanden)
3. **refreshManager.loadConfig()** wird aufgerufen → Werte aus ExtendedConfig übernommen
4. **Fenster werden hinzugefügt** → `refreshDelay` und `overlayDelay` werden verwendet

**Quelle:** `RefreshManager.js:17-29`

---

## ⚙️ Aktuelle Funktionsweise

### **Koordinierter Refresh (startCoordinatedRefresh)**

```javascript
this.interval = setInterval(() => {
    const now = Date.now();
    for (const w of this.windows) {
        if (now - w.lastRefresh >= w.refreshDelay && !w.isRefreshing) {
            this.refreshWindow(w);
        }
    }
}, 1000); // ⚠️ Prüft ALLE 1 Sekunde
```

**Verhalten:**
- ✅ Prüft alle 1 Sekunde, ob ein Fenster neu geladen werden muss
- ✅ Lädt nur Fenster neu, die `refreshDelay` überschritten haben
- ✅ Verhindert gleichzeitige Refreshes (`isRefreshing` Flag)
- ⚠️ **Problem:** Bei 6+ Displays = 6× Checks pro Sekunde = Overhead

**Quelle:** `RefreshManager.js:47-62`

### **Refresh-Ablauf (refreshWindow)**

1. Overlay wird eingeblendet (`showOverlay()`)
2. **Wartet `overlayDelay` Millisekunden** (Standard: 3,5 Sekunden)
3. Lädt die URL neu (`safeLoadUrl()`)
4. Wartet auf `did-finish-load`
5. Overlay wird ausgeblendet (`hideOverlay()`)

**Quelle:** `RefreshManager.js:81-130`

---

## 🚫 Ausnahmen (Skip-Liste)

Folgende URLs werden **NICHT** automatisch neu geladen:

```javascript
const skipList = [
    'https://shop.tiptorro.com/livescoretv',
    'https://shop.tiptorro.com/livescoretv2'
];
```

**Quelle:** `RefreshManager.js:73-79`

---

## 📐 Validierung (ExtendedConfig)

Die ExtendedConfig validiert die Werte beim Speichern:

- **intervalMs:** Minimum `30000` ms (30 Sekunden), Standard `1200000` (20 Minuten)
- **overlayMinTimeMs:** Minimum `1000` ms (1 Sekunde), Standard `3500` (3,5 Sekunden)
- **retryDelayMs:** Minimum `500` ms (0,5 Sekunden), Standard `1000` (1 Sekunde)

**Quelle:** `ExtendedConfig.js:137-141`

---

## 🔧 Besonderheiten

### **Staggering bei Fenster-Erstellung**

In `displays.js` wird beim Hinzufügen eines Fensters ein Staggering-Mechanismus verwendet:

```javascript
refreshManager.addWindow(win, {
    url: url,
    refreshDelay: liveWindows.length * 1000  // ⚠️ Wird überschrieben!
});
```

**Problem:** Dies wird später durch `refreshManager.refreshDelay` überschrieben (siehe `RefreshManager.js:36`), daher hat dieser Code aktuell keine Wirkung.

**Quelle:** `displays.js:174-177`

---

## 📊 Zusammenfassung

| Parameter | Standardwert | Einheit | Konfigurierbar | Performance-Relevant |
|-----------|--------------|---------|----------------|---------------------|
| **refreshDelay** | 1200000 | ms (20 Min) | ✅ Ja | ⚠️ Mittel (Refresh-Frequenz) |
| **overlayDelay** | 3500 | ms (3,5 Sek) | ✅ Ja | ⚠️ Niedrig (Overlay-Dauer) |
| **Interval-Check** | 1000 | ms (1 Sek) | ❌ Nein | 🔴 **Hoch** (CPU-Overhead bei 6+ Displays) |

---

## ⚠️ Performance-Probleme (aus Performance-Analyse)

### **1. Interval-Check zu häufig (1000ms)**
- **Problem:** Bei 6 Displays = 6× Prüfungen pro Sekunde
- **Empfehlung:** Interval auf 5s erhöhen bei 6+ Displays
- **Impact:** Reduziert CPU-Overhead um ~80%

### **2. Koordinierte Refreshes (alle gleichzeitig möglich)**
- **Problem:** Alle 6 Fenster können gleichzeitig reloaden → GPU-Spitze
- **Empfehlung:** Staggered Refreshes (1 Fenster alle 5 Sekunden)
- **Impact:** Verhindert GPU-Spitzen

---

## 📝 Empfehlungen (aus Performance-Analyse)

1. **Interval-Check optimieren:**
   ```javascript
   this.interval = setInterval(() => {
       // ...
   }, this.windows.length > 5 ? 5000 : 1000); // 5s bei 6+ Displays
   ```

2. **Staggered Refreshes:**
   - Statt alle gleichzeitig → 1 Fenster alle 5 Sekunden
   - Reduziert GPU-Spitzen

3. **refreshDelay konfigurierbar lassen:**
   - Standard 20 Minuten ist OK
   - Benutzer können über ExtendedConfig anpassen

---

**Ende der Analyse**

