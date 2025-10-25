// modules/PerformanceMonitor.js
const EventEmitter = require('events');
const logger = require('./logger');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = [];
        this.startTime = Date.now();
        this.isMonitoring = false;
        this.monitoringInterval = null;
    }
    
    // Startet das Performance-Monitoring
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        logger.logSuccess('[PERFORMANCE] Monitoring gestartet');
        
        // Sammle Metriken alle 30 Sekunden
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 30000);
        
        // Erste Messung sofort
        this.collectMetrics();
    }
    
    // Stoppt das Monitoring
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        logger.logInfo('[PERFORMANCE] Monitoring gestoppt');
    }
    
    // Sammelt aktuelle Performance-Metriken
    collectMetrics() {
        const now = Date.now();
        const memoryUsage = process.memoryUsage();
        
        const metrics = {
            timestamp: now,
            uptime: Math.floor((now - this.startTime) / 1000), // Sekunden
            memory: {
                rss: Math.floor(memoryUsage.rss / 1024 / 1024), // MB
                heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024), // MB
                external: Math.floor(memoryUsage.external / 1024 / 1024) // MB
            },
            cpu: process.cpuUsage()
        };
        
        this.metrics.push(metrics);
        
        // Behalte nur die letzten 100 Messungen
        if (this.metrics.length > 100) {
            this.metrics.shift();
        }
        
        // Event für Echtzeit-Updates
        this.emit('metricsUpdate', metrics);
        
        // Warnungen bei hohem Speicherverbrauch
        if (metrics.memory.heapUsed > 200) {
            this.emit('warning', {
                type: 'highMemory',
                value: metrics.memory.heapUsed,
                message: `Hoher Speicherverbrauch: ${metrics.memory.heapUsed}MB`
            });
        }
        
        logger.logDebug(`[PERFORMANCE] RAM: ${metrics.memory.heapUsed}MB, Uptime: ${metrics.uptime}s`);
    }
    
    // Trackt Window-Erstellung
    trackWindowCreation(windowType) {
        const start = performance.now();
        
        return {
            end: () => {
                const duration = performance.now() - start;
                this.emit('windowCreated', {
                    type: windowType,
                    duration: Math.round(duration),
                    timestamp: Date.now()
                });
                logger.logDebug(`[PERFORMANCE] ${windowType} erstellt in ${duration.toFixed(2)}ms`);
            }
        };
    }
    
    // Trackt Refresh-Performance
    trackRefresh(windowId) {
        const start = performance.now();
        
        return {
            end: () => {
                const duration = performance.now() - start;
                this.emit('refreshCompleted', {
                    windowId: windowId,
                    duration: Math.round(duration),
                    timestamp: Date.now()
                });
                logger.logDebug(`[PERFORMANCE] Refresh Window-${windowId} in ${duration.toFixed(2)}ms`);
            }
        };
    }
    
    // Gibt aktuelle Statistiken zurück
    getStats() {
        if (this.metrics.length === 0) {
            return null;
        }
        
        const latest = this.metrics[this.metrics.length - 1];
        const oldest = this.metrics[0];
        
        return {
            current: latest,
            uptime: latest.uptime,
            averageMemory: Math.floor(
                this.metrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) / this.metrics.length
            ),
            peakMemory: Math.max(...this.metrics.map(m => m.memory.heapUsed)),
            dataPoints: this.metrics.length
        };
    }
    
    // Gibt Metriken für Dashboard zurück
    getDashboardData() {
        const stats = this.getStats();
        if (!stats) return null;
        
        return {
            uptime: this.formatUptime(stats.uptime),
            currentMemory: `${stats.current.memory.heapUsed}MB`,
            averageMemory: `${stats.averageMemory}MB`,
            peakMemory: `${stats.peakMemory}MB`,
            status: this.getHealthStatus(stats),
            lastUpdate: new Date(stats.current.timestamp).toLocaleTimeString()
        };
    }
    
    // Formatiert Uptime lesbar
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    // Bestimmt Gesundheitsstatus
    getHealthStatus(stats) {
        if (stats.peakMemory > 300) return 'critical';
        if (stats.averageMemory > 200) return 'warning';
        return 'healthy';
    }
    
    // Cleanup
    cleanup() {
        this.stopMonitoring();
        this.metrics = [];
        this.removeAllListeners();
    }
}

module.exports = PerformanceMonitor;