// modules/DisplayService.js
const { screen } = require('electron');
const EventEmitter = require('events');
const logger = require('./logger');

class DisplayService extends EventEmitter {
  constructor() {
    super();
    this.displays = [];
    this.setupEventListeners();
    this.updateDisplays();
  }

  setupEventListeners() {
    screen.on('display-added', (event, newDisplay) => {
      logger.logSuccess(`Monitor hinzugefügt: ${newDisplay.bounds.width}x${newDisplay.bounds.height} at ${newDisplay.bounds.x},${newDisplay.bounds.y}`);
      this.updateDisplays();
      this.emit('display-added', newDisplay);
    });

    screen.on('display-removed', (event, oldDisplay) => {
      logger.logWarning(`Monitor entfernt: ID ${oldDisplay.id}`);
      this.updateDisplays();
      this.emit('display-removed', oldDisplay);
    });

    screen.on('display-metrics-changed', (event, display, changedMetrics) => {
      logger.logDebug(`Monitor-Metrik geändert: ID ${display.id}`, changedMetrics);
      this.updateDisplays();
      this.emit('display-metrics-changed', display, changedMetrics);
    });
  }

  updateDisplays() {
    const oldDisplays = [...this.displays];
    this.displays = screen.getAllDisplays();
    
    logger.logDebug(`Displays aktualisiert: ${this.displays.length} Monitor(e) erkannt`);
    
    // Prüfe auf Änderungen
    if (oldDisplays.length !== this.displays.length) {
      this.emit('display-count-changed', {
        old: oldDisplays.length,
        new: this.displays.length,
        displays: this.displays
      });
    }
  }

  getAllDisplays() {
    return [...this.displays];
  }

  getDisplayById(id) {
    return this.displays.find(display => display.id === id);
  }

  getDisplayByIndex(index) {
    return this.displays[index] || null;
  }

  // Validiert ob eine Monitor-Konfiguration noch gültig ist
  validateMonitorConfig(configs) {
    const validConfigs = [];
    const invalidConfigs = [];

    configs.forEach(config => {
      const display = this.getDisplayByIndex(config.monitorIndex);
      if (display) {
        validConfigs.push(config);
      } else {
        logger.logWarning(`Ungültige Monitor-Konfiguration: Index ${config.monitorIndex} existiert nicht`);
        invalidConfigs.push(config);
      }
    });

    if (invalidConfigs.length > 0) {
      this.emit('invalid-configs-detected', invalidConfigs);
    }

    return {
      valid: validConfigs,
      invalid: invalidConfigs
    };
  }

  cleanup() {
    screen.removeAllListeners();
    this.removeAllListeners();
    logger.logDebug('DisplayService cleanup abgeschlossen');
  }
}

module.exports = DisplayService;