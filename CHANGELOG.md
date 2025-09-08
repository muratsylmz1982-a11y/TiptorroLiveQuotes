## [1.2.3] - 2025-09-08
### Fixed
- **Hotplug StabilitÃ¤t:** Laufzeit-Parken mit kurzem Freeze, damit Fenster beim Abziehen eines Displays **nicht** auf den PrimÃ¤rmonitor fallen.
- **Startup-Verhalten:** Beim App-/PC-Neustart wird **nicht** automatisch geparkt (nur zur Laufzeit).
- **Mehrmonitor-Support:** Park/Unpark pro Ziel-Display, keine Seiteneffekte auf andere Monitore.
- **Kleinigkeiten:** Vereinheitlichte `safeload`-Imports (Case-Fix fÃ¼r TS1149).
- **UTF-8/Encoding:** Umlaute stabil in Start/Settings/Dashboard.

### Security
- Allowlist + `safeLoadUrl` (Monitore & Refresh-Overlay).
- `will-navigate`/`setWindowOpenHandler` auf allen WebContents.
- Strengere Content-Security-Policy & Session-Hardening.

### Tests
- Jest-Suite komplett grÃ¼n.

### Notes
- Geparkte Fenster laufen im Hintergrund weiter (Background-Throttling aus) und erscheinen automatisch wieder, wenn ihr Monitor zurÃ¼ckkommt.

---

## [1.2.0]
- Fix: Umlaute/Encoding stabilisiert (Start/Settings/Dashboard)
- Docs: README, ARCHITECTURE, OPERATIONS, SECURITY ergÃ¤nzt
- CI: GitHub Actions (npm ci + npm test)
- Security: Allowlist + Hardening-Hooks (monitor-only), BrowserWindow-Flags
