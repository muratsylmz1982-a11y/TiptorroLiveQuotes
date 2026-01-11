/**
 * ShellManager.js
 * Verwaltet den Kiosk-Modus über Windows Shell Registry
 * 
 * Kiosk-Modus: TTQuotes.exe wird als Windows Shell gesetzt (HKLM\...\Winlogon\Shell)
 * Normal-Modus: explorer.exe ist die Shell (Standard-Windows)
 * 
 * WICHTIG: TTQuotes MUSS unter C:\TTQuotes\TTQuotes.exe installiert sein!
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Fester Installations-Pfad für Kiosk-Modus
const KIOSK_INSTALL_PATH = 'C:\\TTQuotes\\TTQuotes.exe';
const REGISTRY_KEY = 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon';
const REGISTRY_VALUE = 'Shell';
const DEFAULT_SHELL = 'explorer.exe';

class ShellManager {
  constructor(app) {
    this.app = app;
    this.isDev = !app.isPackaged;
    logger.info('🔧 [SHELL-MANAGER] Initialisiert (Registry-basiert)', { 
      kioskPath: KIOSK_INSTALL_PATH,
      isDev: this.isDev
    });
  }

  /**
   * Prüft, ob Kiosk-Modus aktiv ist (TTQuotes als Shell gesetzt)
   * @returns {Promise<boolean>}
   */
  async isKioskMode() {
    try {
      const currentShell = await this._getRegistryValue(REGISTRY_KEY, REGISTRY_VALUE);
      const isKiosk = currentShell && currentShell.includes('TTQuotes.exe');
      
      logger.info('ℹ️  [SHELL-MANAGER] Shell-Status', { 
        currentShell, 
        isKiosk 
      });
      
      return isKiosk;
    } catch (error) {
      logger.error('❌ [SHELL-MANAGER] Fehler beim Prüfen des Shell-Status', { 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Aktiviert den Kiosk-Modus (setzt TTQuotes als Shell)
   * @returns {Promise<boolean>} true wenn erfolgreich
   */
  async enableKioskMode() {
    try {
      // Entwicklungsmodus nicht unterstützt
      if (this.isDev) {
        const error = new Error('DEV_MODE_NOT_SUPPORTED');
        error.code = 'DEV_MODE_NOT_SUPPORTED';
        throw error;
      }

      logger.info('🔄 [SHELL-MANAGER] Aktiviere Kiosk-Modus...');
      
      // Prüfe ob TTQuotes unter C:\TTQuotes installiert ist
      if (!fs.existsSync(KIOSK_INSTALL_PATH)) {
        throw new Error(`TTQuotes wurde nicht unter ${KIOSK_INSTALL_PATH} gefunden!\n\nBitte installiere TTQuotes nach C:\\TTQuotes\\`);
      }

      // Backup der aktuellen Shell
      const currentShell = await this._getRegistryValue(REGISTRY_KEY, REGISTRY_VALUE);
      logger.info('📦 [SHELL-MANAGER] Backup aktueller Shell-Wert', { currentShell });

      // Setze TTQuotes als Shell
      const success = await this._setRegistryValue(
        REGISTRY_KEY, 
        REGISTRY_VALUE, 
        KIOSK_INSTALL_PATH
      );

      if (success) {
        logger.info('✅ [SHELL-MANAGER] Kiosk-Modus aktiviert', { 
          shell: KIOSK_INSTALL_PATH 
        });
        return true;
      } else {
        throw new Error('Registry-Änderung fehlgeschlagen');
      }
    } catch (error) {
      logger.error('❌ [SHELL-MANAGER] Fehler beim Aktivieren des Kiosk-Modus', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Deaktiviert den Kiosk-Modus (setzt explorer.exe als Shell)
   * @returns {Promise<boolean>} true wenn erfolgreich
   */
  async disableKioskMode() {
    try {
      logger.info('🔄 [SHELL-MANAGER] Deaktiviere Kiosk-Modus...');
      
      // Setze explorer.exe als Shell
      const success = await this._setRegistryValue(
        REGISTRY_KEY, 
        REGISTRY_VALUE, 
        DEFAULT_SHELL
      );

      if (success) {
        logger.info('✅ [SHELL-MANAGER] Kiosk-Modus deaktiviert', { 
          shell: DEFAULT_SHELL 
        });
        
        // Starte explorer.exe falls noch nicht läuft
        await this._startExplorer();
        
        return true;
      } else {
        throw new Error('Registry-Änderung fehlgeschlagen. Mögliche Ursache: UAC-Anfrage wurde abgelehnt.');
      }
    } catch (error) {
      logger.error('❌ [SHELL-MANAGER] Fehler beim Deaktivieren des Kiosk-Modus', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Holt den aktuellen Shell-Wert aus der Registry
   * @private
   * @param {string} key - Registry Key
   * @param {string} valueName - Value Name
   * @returns {Promise<string>}
   */
  _getRegistryValue(key, valueName) {
    return new Promise((resolve, reject) => {
      // reg query "KEY" /v "ValueName"
      const proc = spawn('reg', ['query', key, '/v', valueName], {
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          // Parse Output: "Shell    REG_SZ    explorer.exe"
          const match = stdout.match(/REG_SZ\s+(.+)/);
          if (match && match[1]) {
            resolve(match[1].trim());
          } else {
            resolve(DEFAULT_SHELL);
          }
        } else {
          reject(new Error(`Registry Query fehlgeschlagen: ${stderr}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Setzt einen Registry-Wert mit Admin-Rechten (über elevate.exe)
   * @private
   * @param {string} key - Registry Key
   * @param {string} valueName - Value Name
   * @param {string} value - Neuer Wert
   * @returns {Promise<boolean>}
   */
  _setRegistryValue(key, valueName, value) {
    return new Promise((resolve) => {
      const elevatePath = this._getElevatePath();
      
      if (!elevatePath || !fs.existsSync(elevatePath)) {
        logger.error('❌ [SHELL-MANAGER] elevate.exe nicht gefunden', { 
          path: elevatePath 
        });
        resolve(false);
        return;
      }

      logger.info('🔐 [SHELL-MANAGER] Setze Registry-Wert mit Admin-Rechten...', { 
        key, 
        valueName, 
        value,
        elevate: elevatePath
      });

      // elevate.exe -wait reg add "KEY" /v "ValueName" /t REG_SZ /d "Value" /f
      const args = [
        '-wait',
        'reg',
        'add',
        key,
        '/v',
        valueName,
        '/t',
        'REG_SZ',
        '/d',
        value,
        '/f'
      ];

      logger.info('🔐 [SHELL-MANAGER] Starte elevate.exe...', { 
        args: args.join(' ') 
      });

      const proc = spawn(elevatePath, args, {
        windowsHide: true,
        detached: false
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        logger.info('ℹ️  [SHELL-MANAGER] elevate.exe beendet', { 
          exitCode: code 
        });
        
        if (code === 0) {
          logger.info('✅ [SHELL-MANAGER] Registry-Wert erfolgreich gesetzt');
          resolve(true);
        } else if (code === 1) {
          // ExitCode 1 = UAC abgelehnt oder Rechte fehlen
          logger.error('❌ [SHELL-MANAGER] UAC-Anfrage abgelehnt oder keine Admin-Rechte', { 
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
          resolve(false);
        } else {
          logger.error('❌ [SHELL-MANAGER] Registry-Änderung fehlgeschlagen', { 
            exitCode: code,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          });
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        logger.error('❌ [SHELL-MANAGER] elevate.exe konnte nicht gestartet werden', { 
          error: err.message 
        });
        resolve(false);
      });
    });
  }

  /**
   * Startet explorer.exe falls noch nicht läuft
   * @private
   * @returns {Promise<void>}
   */
  async _startExplorer() {
    try {
      logger.info('🔄 [SHELL-MANAGER] Starte explorer.exe...');
      spawn('explorer.exe', [], {
        detached: true,
        stdio: 'ignore'
      });
      logger.info('✅ [SHELL-MANAGER] explorer.exe gestartet');
    } catch (error) {
      logger.error('❌ [SHELL-MANAGER] Fehler beim Starten von explorer.exe', { 
        error: error.message 
      });
    }
  }

  /**
   * Findet den Pfad zu elevate.exe
   * @private
   * @returns {string|null}
   */
  _getElevatePath() {
    // Versuche verschiedene Pfade
    const possiblePaths = [
      path.join(process.resourcesPath, 'elevate.exe'),
      path.join(__dirname, '..', 'resources', 'elevate.exe'),
      path.join(__dirname, '..', 'dist', 'win-unpacked', 'resources', 'elevate.exe')
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return null;
  }

  /**
   * Gibt aktuellen Shell-Status zurück
   * @returns {Promise<{isKiosk: boolean, currentShell: string}>}
   */
  async getStatus() {
    try {
      const currentShell = await this._getRegistryValue(REGISTRY_KEY, REGISTRY_VALUE);
      const isKiosk = currentShell && currentShell.includes('TTQuotes.exe');
      
      return {
        isKiosk,
        currentShell,
        kioskInstallPath: KIOSK_INSTALL_PATH,
        isInstalled: fs.existsSync(KIOSK_INSTALL_PATH)
      };
    } catch (error) {
      logger.error('❌ [SHELL-MANAGER] Fehler beim Abrufen des Status', { 
        error: error.message 
      });
      return {
        isKiosk: false,
        currentShell: 'Unbekannt',
        kioskInstallPath: KIOSK_INSTALL_PATH,
        isInstalled: false
      };
    }
  }
}

module.exports = ShellManager;
