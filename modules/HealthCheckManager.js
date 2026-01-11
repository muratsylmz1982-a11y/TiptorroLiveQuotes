// modules/HealthCheckManager.js
const { app, BrowserWindow } = require('electron');
const os = require('os');
const logger = require('./logger');
const errorHandler = require('./ErrorHandler');

/**
 * Health Check Manager
 * Überwacht den Gesundheitszustand der gesamten Anwendung
 */
class HealthCheckManager {
    constructor() {
        this.startTime = Date.now();
        this.checks = {
            displays: [],
            memory: {},
            cpu: {},
            network: {},
            errors: {}
        };
        this.checkInterval = null;
        this.subscribers = new Set();
        
        logger.logSuccess('[HEALTH-CHECK] Initialisiert');
    }

    /**
     * Startet kontinuierliches Health Monitoring
     */
    startMonitoring(intervalMs = 5000) {
        if (this.checkInterval) {
            logger.logWarning('[HEALTH-CHECK] Monitoring läuft bereits');
            return;
        }

        this.checkInterval = setInterval(() => {
            this.performHealthCheck();
        }, intervalMs);

        logger.logInfo('[HEALTH-CHECK] Monitoring gestartet', {
            intervalMs: intervalMs
        });

        // Erste Check sofort ausführen
        this.performHealthCheck();
    }

    /**
     * Stoppt das Health Monitoring
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            logger.logInfo('[HEALTH-CHECK] Monitoring gestoppt');
        }
    }

    /**
     * Führt einen kompletten Health Check durch
     */
    async performHealthCheck() {
        try {
            const health = {
                timestamp: new Date().toISOString(),
                uptime: this.getUptime(),
                displays: await this.checkDisplays(),
                memory: this.checkMemory(),
                cpu: this.checkCPU(),
                network: this.checkNetwork(),
                errors: this.checkErrors(),
                overall: 'healthy'
            };

            // Berechne Overall Status
            health.overall = this.calculateOverallStatus(health);

            this.checks = health;

            // Benachrichtige Subscribers
            this.notifySubscribers(health);

            return health;
        } catch (error) {
            logger.logError('[HEALTH-CHECK] Fehler beim Health Check', error);
            return null;
        }
    }

    /**
     * Prüft den Status aller Display-Fenster
     */
    async checkDisplays() {
        const windows = BrowserWindow.getAllWindows();
        // Filter: Alle Fenster AUSSER Config-UI und Dashboards
        const displayWindows = windows.filter(win => {
            const title = win.getTitle();
            const url = win.webContents.getURL();
            
            // Exclude UI windows
            if (title.includes('Config') || 
                title.includes('Settings') || 
                title.includes('Dashboard') ||
                url.includes('index.html') ||
                url.includes('extended-settings.html') ||
                url.includes('performance-dashboard.html') ||
                url.includes('health-check-dashboard.html')) {
                return false;
            }
            
            // Include all other windows (Live-Views, Ticketchecker, etc.)
            return true;
        });

        const displays = displayWindows.map(win => {
            const webContents = win.webContents;
            const isLoading = webContents.isLoading();
            const url = webContents.getURL();
            
            // Status bestimmen
            let status = 'active';
            if (isLoading) {
                status = 'loading';
            } else if (!url || url === 'about:blank') {
                status = 'empty';
            } else if (webContents.isCrashed()) {
                status = 'crashed';
            }

            return {
                id: win.id,
                title: win.getTitle(),
                url: url,
                status: status,
                isVisible: win.isVisible(),
                isMinimized: win.isMinimized(),
                isDestroyed: win.isDestroyed(),
                bounds: win.getBounds()
            };
        });

        const stats = {
            total: displays.length,
            active: displays.filter(d => d.status === 'active').length,
            loading: displays.filter(d => d.status === 'loading').length,
            crashed: displays.filter(d => d.status === 'crashed').length,
            empty: displays.filter(d => d.status === 'empty').length,
            displays: displays
        };

        return stats;
    }

    /**
     * Prüft Speicher-Auslastung
     */
    checkMemory() {
        const processMemory = process.memoryUsage();
        const systemMemory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };

        const memoryInfo = {
            process: {
                rss: this.formatBytes(processMemory.rss),
                heapTotal: this.formatBytes(processMemory.heapTotal),
                heapUsed: this.formatBytes(processMemory.heapUsed),
                external: this.formatBytes(processMemory.external)
            },
            system: {
                total: this.formatBytes(systemMemory.total),
                used: this.formatBytes(systemMemory.used),
                free: this.formatBytes(systemMemory.free),
                percentUsed: parseFloat(((systemMemory.used / systemMemory.total) * 100).toFixed(1))
            },
            status: 'healthy'
        };

        // Warnung bei hoher Speicher-Auslastung
        if (memoryInfo.system.percentUsed > 85) {
            memoryInfo.status = 'warning';
        }
        if (memoryInfo.system.percentUsed > 95) {
            memoryInfo.status = 'critical';
        }

        return memoryInfo;
    }

    /**
     * Prüft CPU-Auslastung
     */
    checkCPU() {
        const cpus = os.cpus();
        const cpuInfo = {
            count: cpus.length,
            model: cpus[0].model,
            speed: `${cpus[0].speed} MHz`,
            load: this.getCPULoad(cpus),
            status: 'healthy'
        };

        if (cpuInfo.load > 80) {
            cpuInfo.status = 'warning';
        }
        if (cpuInfo.load > 95) {
            cpuInfo.status = 'critical';
        }

        return cpuInfo;
    }

    /**
     * Berechnet CPU-Last
     */
    getCPULoad(cpus) {
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const load = 100 - (100 * idle / total);

        return load.toFixed(1);
    }

    /**
     * Prüft Netzwerk-Status
     */
    checkNetwork() {
        const interfaces = os.networkInterfaces();
        const activeInterfaces = [];

        for (const name in interfaces) {
            const iface = interfaces[name];
            const active = iface.filter(i => !i.internal && i.family === 'IPv4');
            if (active.length > 0) {
                activeInterfaces.push({
                    name: name,
                    address: active[0].address,
                    mac: active[0].mac
                });
            }
        }

        return {
            online: activeInterfaces.length > 0,
            interfaces: activeInterfaces,
            count: activeInterfaces.length,
            status: activeInterfaces.length > 0 ? 'healthy' : 'offline'
        };
    }

    /**
     * Prüft Fehler-Status
     */
    checkErrors() {
        try {
            const errorHandlerInstance = errorHandler.getInstance();
            const stats = errorHandlerInstance.getStats();

            return {
                totalErrors: stats.totalErrors,
                errorTypes: stats.errorTypes,
                recentErrors: stats.recentErrors.length,
                status: stats.totalErrors === 0 ? 'healthy' : 
                       stats.totalErrors < 5 ? 'warning' : 'critical'
            };
        } catch (error) {
            // Error Handler noch nicht initialisiert
            return {
                totalErrors: 0,
                errorTypes: {},
                recentErrors: 0,
                status: 'unknown'
            };
        }
    }

    /**
     * Berechnet Overall Health Status
     */
    calculateOverallStatus(health) {
        const criticalIssues = [];
        const warnings = [];

        // Display Checks
        if (health.displays.crashed > 0) {
            criticalIssues.push('Displays crashed');
        }
        if (health.displays.total === 0) {
            warnings.push('No displays active');
        }

        // Memory Checks
        if (health.memory.status === 'critical') {
            criticalIssues.push('Critical memory usage');
        } else if (health.memory.status === 'warning') {
            warnings.push('High memory usage');
        }

        // CPU Checks
        if (health.cpu.status === 'critical') {
            criticalIssues.push('Critical CPU load');
        } else if (health.cpu.status === 'warning') {
            warnings.push('High CPU load');
        }

        // Network Checks
        if (health.network.status === 'offline') {
            criticalIssues.push('Network offline');
        }

        // Error Checks
        if (health.errors.status === 'critical') {
            criticalIssues.push('Multiple errors detected');
        } else if (health.errors.status === 'warning') {
            warnings.push('Some errors detected');
        }

        // Status bestimmen
        if (criticalIssues.length > 0) {
            return {
                status: 'critical',
                issues: criticalIssues,
                warnings: warnings
            };
        } else if (warnings.length > 0) {
            return {
                status: 'warning',
                issues: [],
                warnings: warnings
            };
        } else {
            return {
                status: 'healthy',
                issues: [],
                warnings: []
            };
        }
    }

    /**
     * Gibt Uptime zurück
     */
    getUptime() {
        const uptimeMs = Date.now() - this.startTime;
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Formatiert Bytes zu lesbarer Größe
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Registriert einen Subscriber für Health Updates
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        logger.logInfo('[HEALTH-CHECK] Subscriber registriert', {
            totalSubscribers: this.subscribers.size
        });
    }

    /**
     * Entfernt einen Subscriber
     */
    unsubscribe(callback) {
        this.subscribers.delete(callback);
        logger.logInfo('[HEALTH-CHECK] Subscriber entfernt', {
            totalSubscribers: this.subscribers.size
        });
    }

    /**
     * Benachrichtigt alle Subscribers
     */
    notifySubscribers(health) {
        this.subscribers.forEach(callback => {
            try {
                callback(health);
            } catch (error) {
                logger.logError('[HEALTH-CHECK] Fehler beim Benachrichtigen von Subscriber', error);
            }
        });
    }

    /**
     * Gibt aktuellen Health Status zurück
     */
    getHealth() {
        return this.checks;
    }

    /**
     * Gibt System-Info zurück
     */
    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            hostname: os.hostname(),
            cpus: os.cpus().length,
            memory: this.formatBytes(os.totalmem()),
            electron: process.versions.electron,
            node: process.versions.node,
            chrome: process.versions.chrome
        };
    }
}

// Singleton Instance
let healthCheckInstance = null;

module.exports = {
    /**
     * Initialisiert den Health Check Manager
     */
    init: () => {
        if (!healthCheckInstance) {
            healthCheckInstance = new HealthCheckManager();
        }
        return healthCheckInstance;
    },

    /**
     * Gibt die Health Check Manager Instance zurück
     */
    getInstance: () => {
        if (!healthCheckInstance) {
            throw new Error('HealthCheckManager not initialized. Call init() first.');
        }
        return healthCheckInstance;
    }
};

