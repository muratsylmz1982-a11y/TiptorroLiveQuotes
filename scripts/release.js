#!/usr/bin/env node

/**
 * Release-Helper Skript für TTQuotes
 * 
 * Führt automatisch folgende Schritte aus:
 * 1. Tests ausführen
 * 2. Version erhöhen
 * 3. Build erstellen
 * 4. Git Tag erstellen
 * 5. Zusammenfassung ausgeben
 * 
 * Usage:
 *   npm run release [patch|minor|major]
 *   npm run release patch   // 1.2.3 -> 1.2.4
 *   npm run release minor   // 1.2.3 -> 1.3.0
 *   npm run release major   // 1.2.3 -> 2.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Farben für Console-Output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    log(`❌ ${message}`, 'red');
    process.exit(1);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function exec(command, silent = false) {
    try {
        const result = execSync(command, { 
            encoding: 'utf8',
            stdio: silent ? 'pipe' : 'inherit'
        });
        return result;
    } catch (err) {
        error(`Fehler beim Ausführen: ${command}\n${err.message}`);
    }
}

function getPackageJson() {
    const packagePath = path.join(process.cwd(), 'package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function bumpVersion(type = 'patch') {
    const validTypes = ['patch', 'minor', 'major'];
    if (!validTypes.includes(type)) {
        error(`Ungültiger Version-Typ: ${type}. Erlaube: ${validTypes.join(', ')}`);
    }

    const pkg = getPackageJson();
    const oldVersion = pkg.version;
    
    // npm version ausführen (bumpt automatisch package.json und erstellt git tag)
    exec(`npm version ${type} --no-git-tag-version`, true);
    
    const newPkg = getPackageJson();
    const newVersion = newPkg.version;
    
    success(`Version erhöht: ${oldVersion} → ${newVersion}`);
    return { oldVersion, newVersion };
}

function checkGitStatus() {
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            warning('Es gibt uncommittete Änderungen:');
            console.log(status);
            
            // Frage Benutzer (nur in interaktiver Shell)
            if (process.stdin.isTTY) {
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                return new Promise((resolve) => {
                    readline.question('Trotzdem fortfahren? (y/N): ', (answer) => {
                        readline.close();
                        if (answer.toLowerCase() !== 'y') {
                            error('Release abgebrochen');
                        }
                        resolve();
                    });
                });
            }
        }
    } catch (err) {
        warning('Keine Git-Repository gefunden oder Git nicht verfügbar');
    }
    return Promise.resolve();
}

async function main() {
    console.log('\n' + '='.repeat(60));
    log('🚀 TTQuotes Release-Helper', 'cyan');
    console.log('='.repeat(60) + '\n');

    // Argument auslesen (patch/minor/major)
    const versionType = process.argv[2] || 'patch';
    
    info(`Release-Typ: ${versionType}`);
    console.log();

    // 1. Git-Status prüfen
    info('Schritt 1/5: Git-Status prüfen...');
    await checkGitStatus();
    success('Git-Status OK');
    console.log();

    // 2. Tests ausführen
    info('Schritt 2/5: Tests ausführen...');
    try {
        exec('npm test');
        success('Alle Tests erfolgreich');
    } catch (err) {
        error('Tests fehlgeschlagen! Behebe die Fehler vor dem Release.');
    }
    console.log();

    // 3. Version erhöhen
    info('Schritt 3/5: Version erhöhen...');
    const { oldVersion, newVersion } = bumpVersion(versionType);
    console.log();

    // 4. Build erstellen
    info('Schritt 4/5: Build erstellen...');
    exec('npm run build');
    success('Build erfolgreich erstellt');
    console.log();

    // 5. Git Commit & Tag
    info('Schritt 5/5: Git Commit & Tag erstellen...');
    try {
        exec('git add package.json package-lock.json', true);
        exec(`git commit -m "chore: bump version to ${newVersion}"`, true);
        exec(`git tag v${newVersion}`, true);
        success(`Git Tag v${newVersion} erstellt`);
    } catch (err) {
        warning('Git-Operationen übersprungen (kein Repository oder Fehler)');
    }
    console.log();

    // Zusammenfassung
    console.log('='.repeat(60));
    log('✨ Release erfolgreich!', 'green');
    console.log('='.repeat(60));
    console.log();
    log(`📦 Version:  ${oldVersion} → ${newVersion}`, 'cyan');
    log(`📁 Build:    dist/TTQuotes Setup ${newVersion}.exe`, 'cyan');
    log(`🏷️  Git Tag:  v${newVersion}`, 'cyan');
    console.log();
    
    info('Nächste Schritte:');
    console.log('  1. Installer testen: dist/TTQuotes Setup ' + newVersion + '.exe');
    console.log('  2. Änderungen pushen: git push && git push --tags');
    console.log('  3. Installer verteilen an Shops');
    console.log();
}

// Fehlerbehandlung
process.on('uncaughtException', (err) => {
    error(`Unerwarteter Fehler: ${err.message}`);
});

process.on('unhandledRejection', (err) => {
    error(`Unerwarteter Fehler: ${err.message}`);
});

// Script ausführen
main().catch(err => {
    error(err.message);
});

