# TTQuotes Build & Release Scripts

Dieses Verzeichnis enthält Hilfs-Skripte für Build und Release.

---

## 🚀 Release-Skript

### Verwendung:

```bash
# Patch-Release (1.2.3 → 1.2.4)
npm run release

# Minor-Release (1.2.3 → 1.3.0)
npm run release:minor

# Major-Release (1.2.3 → 2.0.0)
npm run release:major
```

### Was das Skript macht:

1. ✅ **Git-Status prüfen** - Warnt bei uncommitteten Änderungen
2. ✅ **Tests ausführen** - `npm test` muss erfolgreich sein
3. ✅ **Version erhöhen** - Bumpt Version in `package.json`
4. ✅ **Build erstellen** - Führt `electron-builder` aus
5. ✅ **Git Commit & Tag** - Erstellt Commit und Tag für neue Version

### Output:

```
============================================================
🚀 TTQuotes Release-Helper
============================================================

ℹ️  Release-Typ: patch

ℹ️  Schritt 1/5: Git-Status prüfen...
✅ Git-Status OK

ℹ️  Schritt 2/5: Tests ausführen...
✅ Alle Tests erfolgreich

ℹ️  Schritt 3/5: Version erhöhen...
✅ Version erhöht: 1.2.3 → 1.2.4

ℹ️  Schritt 4/5: Build erstellen...
✅ Build erfolgreich erstellt

ℹ️  Schritt 5/5: Git Commit & Tag erstellen...
✅ Git Tag v1.2.4 erstellt

============================================================
✨ Release erfolgreich!
============================================================

📦 Version:  1.2.3 → 1.2.4
📁 Build:    dist/TTQuotes Setup 1.2.4.exe
🏷️  Git Tag:  v1.2.4

ℹ️  Nächste Schritte:
  1. Installer testen: dist/TTQuotes Setup 1.2.4.exe
  2. Änderungen pushen: git push && git push --tags
  3. Installer verteilen an Shops
```

---

## 📋 Versionstypen

| Typ | Beispiel | Wann verwenden? |
|-----|----------|-----------------|
| **patch** | 1.2.3 → 1.2.4 | Bugfixes, kleine Änderungen |
| **minor** | 1.2.3 → 1.3.0 | Neue Features, abwärtskompatibel |
| **major** | 1.2.3 → 2.0.0 | Breaking Changes, große Updates |

---

## 🛠️ Troubleshooting

### "Tests fehlgeschlagen"
→ Behebe die Fehler in den Tests bevor du released

### "Git-Status hat Änderungen"
→ Committe alle Änderungen oder nutze `git stash`

### "Build-Fehler"
→ Prüfe ob alle Dependencies installiert sind: `npm install`

---

## 💡 Tipps

- **Vor Release:** Immer `npm start` testen
- **Nach Release:** Installer auf Test-PC installieren
- **Git Tags:** Pushen mit `git push --tags`
- **Rollback:** Git Tag löschen: `git tag -d v1.2.4`

---

*Erstellt: Oktober 2025*

