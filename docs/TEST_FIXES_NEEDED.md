# Test-Fixes benötigt

## Zusammenfassung der Test-Fehler

Basierend auf den GitHub CI/CD Test-Ergebnissen gibt es folgende Fehler:

### 1. ErrorHandler.test.js
- **Problem**: `app.on` wird nicht mit 'render-process-gone' aufgerufen erwartet
- **Ursache**: `jest.clearAllMocks()` löscht Mock-Aufrufe vor dem Test
- **Fix**: Mock-Aufrufe direkt nach Initialisierung prüfen oder Test-Struktur anpassen

### 2. HealthCheckManager.test.js
- **Problem 1**: `percentUsed` ist String statt Number
  - **Status**: ✅ BEHOBEN (parseFloat hinzugefügt)
- **Problem 2**: `os.cpus()` ist undefined
  - **Status**: ⚠️ Teilweise behoben (Mock-Setup angepasst)
- **Problem 3**: `checkNetwork()` gibt `online: false` statt `true`
  - **Status**: ⚠️ Möglicherweise behoben (Mock-Setup angepasst)
- **Problem 4**: `checkDisplays()` gibt `total: 0` statt `1`
  - **Status**: ⚠️ Teilweise behoben (Mock-Setup angepasst)
- **Problem 5**: `performHealthCheck()` gibt `null` statt Objekt
  - **Ursache**: `checkCPU()` wirft Fehler wegen `os.cpus()` undefined
  - **Status**: ⚠️ Abhängig von Problem 2
- **Problem 6**: Subscriber-Callback wird nicht aufgerufen
  - **Ursache**: `performHealthCheck()` gibt `null` zurück
  - **Status**: ⚠️ Abhängig von Problem 5

### 3. MaxListenersExceededWarning
- **Problem**: 11 uncaughtException/unhandledRejection listeners
- **Ursache**: ErrorHandler wird mehrfach initialisiert (Singleton-Probleme in Tests)
- **Fix**: `process.setMaxListeners()` erhöhen oder Singleton-Logik in Tests anpassen

---

## Empfohlene Fixes (Priorisiert)

### P0: Kritische Fixes

1. **ErrorHandler.test.js - Mock-Verhalten**
   - Mock-Aufrufe nach Initialisierung prüfen (ohne `jest.clearAllMocks()` dazwischen)
   - Oder: Mock-Aufrufe in Array speichern und später prüfen

2. **HealthCheckManager.test.js - os.cpus() Mock**
   - Sicherstellen, dass `os.cpus` als Mock-Funktion gesetzt ist
   - Mock NACH `jest.resetModules()` aber VOR `require()` setzen

### P1: Wichtige Fixes

3. **MaxListenersExceededWarning**
   - `process.setMaxListeners(15)` in ErrorHandler hinzufügen
   - Oder: Singleton-Logik in Tests verbessern

4. **HealthCheckManager.test.js - ErrorHandler Mock**
   - ErrorHandler-Mock hinzufügen (✅ bereits gemacht)
   - Sicherstellen, dass Mock korrekt verwendet wird

---

## Status der bereits durchgeführten Fixes

✅ **modules/HealthCheckManager.js**:
- `percentUsed` gibt jetzt Number zurück (parseFloat hinzugefügt)

⚠️ **tests/HealthCheckManager.test.js**:
- os-Mock-Setup angepasst (`.mockReturnValue()` → `= jest.fn().mockReturnValue()`)
- ErrorHandler-Mock hinzugefügt
- BrowserWindow-Mock in Tests angepasst

⚠️ **tests/ErrorHandler.test.js**:
- `jest.resetModules()` vor `jest.clearAllMocks()` verschoben (möglicherweise nicht ausreichend)

---

## Nächste Schritte

1. Tests erneut ausführen, um zu sehen, welche Fixes funktioniert haben
2. Verbleibende Fehler systematisch beheben
3. MaxListenersExceededWarning beheben

