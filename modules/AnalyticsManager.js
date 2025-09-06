// modules/AnalyticsManager.js
const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const EventEmitter = require('events');

class AnalyticsManager extends EventEmitter {
    constructor(app) {
        super();
        this.app = app;
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.events = [];
        this.isTracking = true;
        this.analyticsPath = utils.getUserDataPath(app, 'analytics.json');
        
        console.log('[ANALYTICS] Session gestartet:', this.sessionId);
        this.trackEvent('app_start');
    }
    
    // Generiert eindeutige Session-ID
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Trackt ein Event
    trackEvent(eventName, data = {}) {
        if (!this.isTracking) return;
        
        const event = {
            id: this.generateEventId(),
            sessionId: this.sessionId,
            event: eventName,
            timestamp: Date.now(),
            data: data
        };
        
        this.events.push(event);
        console.log(`[ANALYTICS] Event: ${eventName}`, data);
        
        // Speichere regelmäßig
        if (this.events.length % 10 === 0) {
            this.saveAnalytics();
        }
    }
    
    // Generiert Event-ID
    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }
    
    // Trackt Monitor-Konfiguration
    trackMonitorSetup(monitors) {
        this.trackEvent('monitor_setup', {
            monitorCount: monitors.length,
            resolutions: monitors.map(m => ({
                width: m.bounds?.width || 0,
                height: m.bounds?.height || 0
            }))
        });
    }
    
    // Trackt Live-View Start
    trackLiveViewStart(configs) {
        this.trackEvent('live_view_start', {
            displayCount: configs.length,
            urls: configs.map(c => ({
                domain: this.extractDomain(c.url),
                type: this.categorizeUrl(c.url)
            }))
        });
    }
    
    // Trackt Refresh-Events
    trackRefresh(windowId, success = true) {
        this.trackEvent('window_refresh', {
            windowId: windowId,
            success: success,
            sessionUptime: Date.now() - this.sessionStart
        });
    }
    
    // Trackt Performance-Warnungen
    trackPerformanceWarning(warningType, value) {
        this.trackEvent('performance_warning', {
            type: warningType,
            value: value,
            sessionUptime: Date.now() - this.sessionStart
        });
    }
    
    // Trackt App-Beendigung
    trackAppExit() {
        const sessionDuration = Date.now() - this.sessionStart;
        this.trackEvent('app_exit', {
            sessionDuration: sessionDuration,
            totalEvents: this.events.length
        });
        this.saveAnalytics();
    }
    
    // Extrahiert Domain aus URL
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'invalid_url';
        }
    }
    
    // Kategorisiert URLs
    categorizeUrl(url) {
        if (url.includes('docs.google.com')) return 'google_docs';
        if (url.includes('shop.tiptorro.com')) return 'tiptorro';
        if (url.includes('livescore')) return 'sports';
        return 'other';
    }
    
    // Speichert Analytics-Daten
    async saveAnalytics() {
        try {
            // Lade bestehende Daten
            let allAnalytics = [];
            if (fs.existsSync(this.analyticsPath)) {
                const existing = await fs.promises.readFile(this.analyticsPath, 'utf-8');
                if (existing.trim()) {
                    allAnalytics = JSON.parse(existing);
                }
            }
            
            // Füge neue Events hinzu
            allAnalytics.push(...this.events);
            
            // Behalte nur Events der letzten 30 Tage
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            allAnalytics = allAnalytics.filter(event => event.timestamp > thirtyDaysAgo);
            
            // Speichern
            await fs.promises.writeFile(this.analyticsPath, JSON.stringify(allAnalytics, null, 2));
            
            console.log(`[ANALYTICS] ${this.events.length} Events gespeichert`);
            this.events = []; // Lokale Events leeren
            
        } catch (error) {
  const logger = require('./logger');
  logger.logError('[ANALYTICS] Fehler beim Speichern', error);
}
    }
    
    // Lädt Analytics-Daten
    async loadAnalytics() {
        try {
            if (!fs.existsSync(this.analyticsPath)) {
                return [];
            }
            
            const data = await fs.promises.readFile(this.analyticsPath, 'utf-8');
            return data.trim() ? JSON.parse(data) : [];
        } catch (error) {
  const logger = require('./logger');
  logger.logError('[ANALYTICS] Fehler beim Laden', error);
  return [];
}
    }
    
    // Generiert Analytics-Report (EINZIGE VERSION)
    async generateReport() {
        try {
            const allEvents = await this.loadAnalytics();
            const combinedEvents = [...allEvents, ...this.events];
            
            if (combinedEvents.length === 0) {
                return {
                    sessionId: this.sessionId,
                    stats: { totalEvents: 0, totalSessions: 1 },
                    eventCounts: {},
                    message: 'Keine Analytics-Daten verfügbar'
                };
            }
            
            const report = {
                sessionId: this.sessionId,
                generatedAt: new Date().toISOString(),
                uptime: Date.now() - this.sessionStart,
                stats: {
                    totalEvents: combinedEvents.length,
                    totalSessions: new Set(combinedEvents.map(e => e.sessionId)).size,
                    dateRange: {
                        from: new Date(Math.min(...combinedEvents.map(e => e.timestamp))).toISOString(),
                        to: new Date().toISOString()
                    }
                },
                eventCounts: {},
                performanceWarnings: combinedEvents.filter(e => e.event === 'performance_warning').length
            };
            
            // Event-Typen zählen
            combinedEvents.forEach(event => {
                report.eventCounts[event.event] = (report.eventCounts[event.event] || 0) + 1;
            });
            
            return report;
        } catch (error) {
  const logger = require('./logger');
  logger.logError('[ANALYTICS] Report-Fehler', error);
  return {
    error: error.message,
    sessionId: this.sessionId,
    stats: { totalEvents: this.events.length, totalSessions: 1 }
  };
}
    }
    
    // Cleanup
    async cleanup() {
        this.trackAppExit();
        this.isTracking = false;
    }
}

module.exports = AnalyticsManager;
