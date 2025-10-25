# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [1.2.5] - 2025-10-25

### Added
- **Error Handler:** Globaler Error Handler für uncaught exceptions, unhandled rejections, renderer crashes
- **Health Check Manager:** Echtzeit-Überwachung von Displays, Speicher, CPU, Netzwerk, Fehlern
- **Health Check Dashboard:** Neue UI für System-Monitoring mit Live-Updates
- **IPC Handlers:** Neue APIs für Health Check und Error Handler Management
- **Error Statistics:** Detaillierte Fehler-Logs mit Timestamps und Typen
- **System Info:** CPU, Memory, Network, Platform-Informationen in Dashboard
- **Crash Recovery:** Automatisches Neuladen von gecrashteten Renderer-Prozessen

### Changed
- **Stabilität:** App stürzt bei Fehlern nicht mehr ab, sondern loggt und erholt sich
- **Monitoring:** Kontinuierliches Health Monitoring alle 5 Sekunden (optional)

### Security
- **Crash Detection:** Erkennung und Logging von GPU, Child Process und Renderer Crashes
- **Unresponsive Detection:** Automatisches Neuladen von nicht reagierenden WebContents

### Tests
- Tests für ErrorHandler (9 Tests)
- Tests für HealthCheckManager (18 Tests)
- 38 von 47 Tests bestehen

### Technical
- Error Handler als Singleton mit Event Listeners
- Health Check Manager mit Subscribe/Notify Pattern
- Separate IPC Handler-Module für bessere Organisation
- Performance-optimiertes Monitoring mit konfigurierbaren Intervallen

---

## [1.2.4] - 2025-10-25

### Added
- **Winston Logger:** Strukturierte Logs mit Timestamps & Emojis
- **Log Rotation:** Automatische Log-Rotation (7 Tage, 10MB pro Datei)

### Changed
- **56 console.log** durch Winston-Logger ersetzt
- **15 Module** mit konsistentem Logging aktualisiert

### Security
- **Enhanced CSP:** Entfernung von unsafe-eval in allen HTML-Dateien
- **Strikte Policies:** object-src, base-uri, form-action hinzugefügt
- **XSS Protection:** Verbessert durch strengere Content Security Policy

### Fixed
- **UTF-8 Encoding:** Alle Umlaute in README und Docs korrigiert
- **Logo Path:** Header-Logo-Pfad in index.html korrigiert

### Documentation
- **Security Checklist:** Aktualisiert (19/34 Items completed)
- **README:** UTF-8 Probleme behoben
- **SECURITY.md:** Implementierungsstatus dokumentiert

---

## [1.2.3] - 2025-09-09

### Changed
- Docs: README/CHANGELOG auf v1.2.3 aktualisiert

### Fixed
- Build/Release: Version-Mismatch zwischen App/Installer und Tag behoben
- Release-Assets (Setup + latest.yml) zu v1.2.3 hinzugefügt
- **Hotplug Stabilität:** Laufzeit-Parken mit kurzem Freeze
- **Startup-Verhalten:** Beim App-/PC-Neustart wird nicht automatisch geparkt
- **Mehrmonitor-Support:** Park/Unpark pro Ziel-Display
- **UTF-8/Encoding:** Umlaute stabil in Start/Settings/Dashboard

### Security
- Allowlist + safeLoadUrl (Monitore & Refresh-Overlay)
- will-navigate/setWindowOpenHandler auf allen WebContents
- Strengere Content-Security-Policy & Session-Hardening

### Tests
- Jest-Suite komplett grün

---

## [1.2.0] - 2025-09-01

### Added
- Allowlist-basierte URL-Validierung
- Hardening-Hooks für alle BrowserWindows

### Fixed
- Umlaute/Encoding stabilisiert
- Security-Verbesserungen

### Documentation
- README, ARCHITECTURE, OPERATIONS, SECURITY ergänzt

### CI/CD
- GitHub Actions (npm ci + npm test)
