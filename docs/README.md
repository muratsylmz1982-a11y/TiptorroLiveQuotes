# TTQuotes Dokumentation

Willkommen zur TTQuotes Dokumentations-Sammlung! 📚

## 📄 Verfügbare Dokumente

### 🎯 Für Endbenutzer

#### **[USER_GUIDE.html](USER_GUIDE.html)** ⭐ NEU!
- **Format:** Modernes HTML mit Tiptorro-Branding
- **Inhalt:** Vollständige Benutzeranleitung mit allen Features v1.2.5
- **Highlights:**
  - Installation & Ersteinrichtung
  - Tägliche Bedienung
  - Health Check Dashboard (NEU)
  - Error Handler System (NEU)
  - Fehlerbehebung & Support
- **Öffnen:** Doppelklick auf die Datei oder im Browser öffnen

#### **[TTQuotes_Benutzerhandbuch_v1.2.5.pdf](TTQuotes_Benutzerhandbuch_v1.2.5.pdf)** ⭐ NEU!
- **Format:** Druckbare PDF-Datei (A4, 3.28 MB)
- **Inhalt:** Identisch mit USER_GUIDE.html
- **Verwendung:** Ausdrucken, per E-Mail versenden, offline lesen

#### **[USER_GUIDE.md](USER_GUIDE.md)**
- **Format:** Markdown (ältere Version)
- **Status:** Legacy, wird durch HTML/PDF ersetzt
- **Hinweis:** Nutzen Sie stattdessen die HTML oder PDF-Version

---

### 🏗️ Für Entwickler & Admins

#### **[ARCHITECTURE.md](ARCHITECTURE.md)**
- Systemarchitektur und Modul-Übersicht
- Electron-Prozess-Struktur (Main, Renderer, Preload)
- IPC-Kommunikation und Event-Flow
- Modul-Abhängigkeiten und Design-Patterns

#### **[SECURITY.md](SECURITY.md)**
- Sicherheits-Checkliste für Electron
- Content Security Policy (CSP)
- Domain Allowlist-Konfiguration
- Session Hardening & Best Practices

#### **[OPERATIONS.md](OPERATIONS.md)**
- Deployment-Guide
- Server-Setup und Systemanforderungen
- Monitoring und Wartung
- Update-Strategien

#### **[SUPPORT_INSTALLATION.md](SUPPORT_INSTALLATION.md)**
- Support-Team Installations-Guide
- Häufige Probleme und Lösungen
- Remote-Support-Anleitung
- Troubleshooting-Checklisten

#### **[MITARBEITER_ANLEITUNG.md](MITARBEITER_ANLEITUNG.md)**
- Kurzanleitung für Mitarbeiter
- Tägliche Workflows
- Quick-Reference-Karten

---

## 🔧 PDF-Generierung

Die PDF-Benutzeranleitung wird automatisch aus der HTML-Datei generiert.

### Manuelle Regenerierung

```bash
npm run docs:pdf
```

**Anforderungen:**
- Node.js 16+
- Puppeteer (bereits als Dev-Dependency installiert)

**Ausgabe:**
- `docs/TTQuotes_Benutzerhandbuch_v1.2.5.pdf`

---

## 📝 Neue Features in v1.2.5

### 🛡️ Error Handler System
- Global error handler für alle Prozess-Typen
- Automatische Crash-Recovery mit Neustart
- Detaillierte Error-Statistiken und Logging
- Error-Log mit letzten 10 Einträgen

### 🏥 Health Check Dashboard
- Echtzeit-Monitoring aller System-Metriken
- Display-Status-Tracking (Active, Loading, Crashed)
- CPU, Memory, Network Monitoring
- Overall Health Status (HEALTHY/WARNING/CRITICAL)
- Always-on-Top Dashboard für permanenten Zugriff

### ⌨️ Global Hotkey
- **Strg + Shift + H** (Windows) / **Cmd + Shift + H** (Mac)
- Öffnet Health Check Dashboard sofort
- Funktioniert auch während Vollbild-Live-Views

---

## 🎨 HTML-Design

Die neue HTML-Benutzeranleitung nutzt das **Tiptorro Brand Design**:

### Farben
- **Primary:** #269947 (Tiptorro Green)
- **Background:** #000000 (Black)
- **Text:** #ffffff (White)
- **Accent:** #eb243a (Red)
- **Gray:** #737373

### Features
- Responsive Design für Mobile, Tablet, Desktop
- Print-optimiert für PDF-Export
- Smooth Scrolling & Hardware-Beschleunigung
- Accessibility-konform (WCAG 2.1 AA)
- Dunkles Theme (reduziert Augenbelastung)

---

## 📧 Support

**Fragen zur Dokumentation?**

- **E-Mail:** support@tiptorro.com
- **GitHub Issues:** [github.com/muratsylmz1982-a11y/TiptorroLiveQuotes/issues](https://github.com/muratsylmz1982-a11y/TiptorroLiveQuotes/issues)

---

## 📜 Changelog

### v1.2.5 (Oktober 2025)
- ✅ Neue HTML-Benutzeranleitung mit Tiptorro-Branding
- ✅ PDF-Version der Benutzeranleitung
- ✅ Dokumentation für Error Handler System
- ✅ Dokumentation für Health Check Dashboard
- ✅ Dokumentation für Global Hotkey
- ✅ Aktualisierte Screenshots und Beispiele

### v1.2.4 (September 2025)
- Initiale Markdown-Dokumentation

---

**© 2025 Torro Tec GmbH • Alle Rechte vorbehalten**

