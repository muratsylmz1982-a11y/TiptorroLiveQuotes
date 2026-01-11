// modules/PerformanceMonitor.js
const EventEmitter = require('events');
const { exec } = require('child_process');
const logger = require('./logger');

class PerformanceMonitor extends EventEmitter {
    constructor(app) {
        super();
        this.app = app; // Electron app instance für GPU-Info
        this.metrics = [];
        this.startTime = Date.now();
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.gpuInfo = null;
        this.getActiveWindowCount = null; // Callback-Funktion zum Ermitteln der aktiven Fenster-Anzahl
    }
    
    // Setzt Callback zum Ermitteln der aktiven Fenster-Anzahl
    setWindowCountCallback(callback) {
        this.getActiveWindowCount = callback;
    }
    
    // Startet das Performance-Monitoring
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        logger.logSuccess('[PERFORMANCE] Monitoring gestartet');
        
        // Sammle Metriken alle 30 Sekunden
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics().catch(err => {
                logger.logWarning(`[PERFORMANCE] Fehler beim Sammeln von Metriken: ${err.message}`);
            });
        }, 30000);
        
        // Erste Messung sofort
        this.collectMetrics().catch(err => {
            logger.logWarning(`[PERFORMANCE] Fehler beim ersten Sammeln von Metriken: ${err.message}`);
        });
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
    
    // Sammelt GPU-Informationen (Electron API)
    async collectGPUInfo() {
        try {
            if (this.app && typeof this.app.getGPUInfo === 'function') {
                const gpuInfo = await this.app.getGPUInfo('complete');
                this.gpuInfo = gpuInfo;
                
                // Debug: Logge die Struktur der GPU-Info (auch in Console für DevTools)
                const gpuKeys = Object.keys(gpuInfo || {});
                console.log(`[PERFORMANCE] GPU-Info erhalten, Keys:`, gpuKeys);
                logger.logInfo(`[PERFORMANCE] GPU-Info erhalten: ${JSON.stringify(gpuKeys)}`);
                
                if (gpuInfo?.features) {
                    const featureKeys = Object.keys(gpuInfo.features);
                    console.log(`[PERFORMANCE] GPU-Features Keys:`, featureKeys);
                    console.log(`[PERFORMANCE] GPU-Features Werte:`, gpuInfo.features);
                    logger.logInfo(`[PERFORMANCE] GPU-Features: ${JSON.stringify(featureKeys)}`);
                }
                
                if (gpuInfo?.auxAttributes) {
                    console.log(`[PERFORMANCE] GPU auxAttributes:`, gpuInfo.auxAttributes);
                }
                
                return gpuInfo;
            } else {
                logger.logDebug(`[PERFORMANCE] app.getGPUInfo nicht verfügbar`);
            }
        } catch (err) {
            logger.logWarning(`[PERFORMANCE] GPU-Info konnte nicht abgerufen werden: ${err.message}`);
        }
        return null;
    }

    // Sammelt VRAM-Nutzung über Windows WMI (nur Windows)
    async collectVRAMUsage() {
        return new Promise((resolve) => {
            if (process.platform !== 'win32') {
                console.log(`[PERFORMANCE] VRAM-Abfrage: Nicht Windows, überspringe`);
                resolve(null);
                return;
            }

            // WMI-Abfrage für GPU-Speicher - versuche verschiedene Formate
            // Format 1: CSV-Format (meist zuverlässiger)
            console.log(`[PERFORMANCE] Starte VRAM-Abfrage über WMI...`);
            logger.logInfo(`[PERFORMANCE] Starte VRAM-Abfrage über WMI...`);
            
            // Versuche zuerst einfache Abfrage ohne Format
            exec('wmic path win32_VideoController get AdapterRAM,Name', 
                { timeout: 10000, encoding: 'utf8', maxBuffer: 1024 * 1024 }, 
                (error, stdout, stderr) => {
                    if (error) {
                        console.error(`[PERFORMANCE] VRAM-Abfrage (Standard) fehlgeschlagen:`, error.message);
                        if (stderr) console.error(`[PERFORMANCE] VRAM-Abfrage (Standard) stderr:`, stderr);
                        logger.logWarning(`[PERFORMANCE] VRAM-Abfrage (Standard) fehlgeschlagen: ${error.message}`);
                        // Fallback: Versuche LIST-Format
                        tryListFormat();
                        return;
                    }

                    if (!stdout || stdout.trim().length === 0) {
                        console.warn(`[PERFORMANCE] VRAM-Abfrage (Standard): Keine Ausgabe`);
                        logger.logWarning(`[PERFORMANCE] VRAM-Abfrage (Standard): Keine Ausgabe`);
                        tryListFormat();
                        return;
                    }
                    
                    // Debug: Logge die komplette Ausgabe
                    console.log(`[PERFORMANCE] VRAM-Abfrage (Standard) komplette Ausgabe:`, stdout);
                    logger.logInfo(`[PERFORMANCE] VRAM-Abfrage (Standard) Ausgabe: ${stdout.substring(0, 500)}`);

                    try {
                        // Standard-Format parsen (Tab-getrennt)
                        const lines = stdout.split('\r\n').filter(l => l.trim());
                        console.log(`[PERFORMANCE] VRAM-Abfrage: ${lines.length} Zeilen gefunden`);
                        
                        // Header-Zeile finden
                        let headerLineIndex = -1;
                        let adapterRAMIndex = -1;
                        let nameIndex = -1;
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line.includes('AdapterRAM') && line.includes('Name')) {
                                headerLineIndex = i;
                                const parts = line.split(/\s+/);
                                adapterRAMIndex = parts.indexOf('AdapterRAM');
                                nameIndex = parts.indexOf('Name');
                                console.log(`[PERFORMANCE] Header gefunden: AdapterRAM=${adapterRAMIndex}, Name=${nameIndex}`);
                                break;
                            }
                        }
                        
                        if (headerLineIndex === -1 || adapterRAMIndex === -1 || nameIndex === -1) {
                            console.warn(`[PERFORMANCE] Header nicht gefunden, versuche LIST-Format`);
                            tryListFormat();
                            return;
                        }

                        // Datenzeilen parsen
                        for (let i = headerLineIndex + 1; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (!line || line === '') continue;
                            
                            const parts = line.split(/\s+/).filter(p => p.trim() !== '');
                            console.log(`[PERFORMANCE] Zeile ${i}:`, parts);
                            
                            if (parts.length > Math.max(adapterRAMIndex, nameIndex)) {
                                const ramStr = parts[adapterRAMIndex];
                                const name = parts.slice(nameIndex).join(' '); // Name kann mehrere Wörter sein
                                
                                console.log(`[PERFORMANCE] Parsing: RAM="${ramStr}", Name="${name}"`);
                                
                                if (name && ramStr && ramStr !== '' && ramStr !== 'AdapterRAM' && !isNaN(parseInt(ramStr, 10))) {
                                    const ramBytes = parseInt(ramStr, 10);
                                    if (!isNaN(ramBytes) && ramBytes > 0) {
                                        const totalVRAM = Math.floor(ramBytes / 1024 / 1024); // MB
                                        console.log(`[PERFORMANCE] VRAM gefunden: ${name} - ${totalVRAM}MB`);
                                        logger.logSuccess(`[PERFORMANCE] VRAM gefunden: ${name} - ${totalVRAM}MB`);
                                        resolve({
                                            totalVRAM: totalVRAM,
                                            gpuName: name
                                        });
                                        return;
                                    }
                                }
                            }
                        }

                        // Keine Daten gefunden, versuche LIST-Format
                        console.warn(`[PERFORMANCE] Keine VRAM-Daten in Standard-Format gefunden`);
                        tryListFormat();
                    } catch (parseErr) {
                        console.error(`[PERFORMANCE] VRAM-Parsing (Standard) fehlgeschlagen:`, parseErr);
                        logger.logError(`[PERFORMANCE] VRAM-Parsing (Standard) fehlgeschlagen`, parseErr);
                        tryListFormat();
                    }
                }
            );

            // Fallback: LIST-Format
            function tryListFormat() {
                console.log(`[PERFORMANCE] Versuche VRAM-Abfrage mit LIST-Format...`);
                logger.logInfo(`[PERFORMANCE] Versuche VRAM-Abfrage mit LIST-Format...`);
                exec('wmic path win32_VideoController get AdapterRAM,Name /format:list', 
                    { timeout: 5000, encoding: 'utf8' }, 
                    (error, stdout, stderr) => {
                        if (error || !stdout) {
                            console.error(`[PERFORMANCE] VRAM-Abfrage (LIST) fehlgeschlagen:`, error?.message || 'keine Ausgabe');
                            if (stderr) console.error(`[PERFORMANCE] VRAM-Abfrage (LIST) stderr:`, stderr);
                            logger.logWarning(`[PERFORMANCE] VRAM-Abfrage (LIST) fehlgeschlagen: ${error?.message || 'keine Ausgabe'}`);
                            resolve(null);
                            return;
                        }
                        
                        // Debug: Logge die ersten 200 Zeichen der Ausgabe
                        console.log(`[PERFORMANCE] VRAM-Abfrage (LIST) Ausgabe (erste 200 Zeichen):`, stdout.substring(0, 200));
                        logger.logInfo(`[PERFORMANCE] VRAM-Abfrage (LIST) Ausgabe (erste 200 Zeichen): ${stdout.substring(0, 200)}`);

                        try {
                            const lines = stdout.split('\n').filter(l => l.trim());
                            const gpuData = {};
                            let currentGPU = null;

                            for (const line of lines) {
                                if (line.startsWith('Name=')) {
                                    if (currentGPU && currentGPU.totalVRAM) {
                                        gpuData[currentGPU.name] = currentGPU;
                                    }
                                    currentGPU = { name: line.substring(5).trim() };
                                } else if (line.startsWith('AdapterRAM=') && currentGPU) {
                                    const ramStr = line.substring(11).trim();
                                    if (ramStr && ramStr !== '' && ramStr !== 'AdapterRAM') {
                                        const ramBytes = parseInt(ramStr, 10);
                                        if (!isNaN(ramBytes) && ramBytes > 0) {
                                            currentGPU.totalVRAM = Math.floor(ramBytes / 1024 / 1024); // MB
                                        }
                                    }
                                }
                            }

                            if (currentGPU && currentGPU.totalVRAM) {
                                gpuData[currentGPU.name] = currentGPU;
                            }

                            // Nimm die erste GPU mit VRAM-Daten
                            const firstGPU = Object.values(gpuData).find(g => g.totalVRAM);
                            if (firstGPU) {
                                console.log(`[PERFORMANCE] VRAM gefunden (LIST): ${firstGPU.name} - ${firstGPU.totalVRAM}MB`);
                                logger.logSuccess(`[PERFORMANCE] VRAM gefunden (LIST): ${firstGPU.name} - ${firstGPU.totalVRAM}MB`);
                                resolve({
                                    totalVRAM: firstGPU.totalVRAM,
                                    gpuName: firstGPU.name
                                });
                            } else {
                                console.warn(`[PERFORMANCE] Keine VRAM-Daten gefunden`);
                                logger.logWarning(`[PERFORMANCE] Keine VRAM-Daten gefunden`);
                                resolve(null);
                            }
                        } catch (parseErr) {
                            console.error(`[PERFORMANCE] VRAM-Parsing (LIST) fehlgeschlagen:`, parseErr.message);
                            logger.logError(`[PERFORMANCE] VRAM-Parsing (LIST) fehlgeschlagen`, parseErr);
                            resolve(null);
                        }
                    }
                );
            }
        });
    }

    // Sammelt aktuelle Performance-Metriken
    async collectMetrics() {
        const now = Date.now();
        const memoryUsage = process.memoryUsage();
        
        // GPU-Info asynchron sammeln (nicht blockierend)
        const gpuInfoPromise = this.collectGPUInfo();
        const vramPromise = this.collectVRAMUsage();
        
        const metrics = {
            timestamp: now,
            uptime: Math.floor((now - this.startTime) / 1000), // Sekunden
            memory: {
                rss: Math.floor(memoryUsage.rss / 1024 / 1024), // MB
                heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024), // MB
                external: Math.floor(memoryUsage.external / 1024 / 1024) // MB
            },
            cpu: process.cpuUsage(),
            gpu: null, // Wird asynchron gefüllt
            vram: null // Wird asynchron gefüllt
        };

        // Warte auf GPU-Daten (mit Timeout)
        try {
            const [gpuInfo, vramData] = await Promise.all([
                Promise.race([gpuInfoPromise, new Promise(resolve => setTimeout(() => resolve(null), 2000))]),
                Promise.race([vramPromise, new Promise(resolve => setTimeout(() => resolve(null), 3000))])
            ]);

            if (gpuInfo) {
                // Extrahiere relevante GPU-Features aus verschiedenen möglichen Pfaden
                const features = gpuInfo.features || {};
                const auxAttributes = gpuInfo.auxAttributes || {};
                
                // Debug: Logge die komplette GPU-Info-Struktur (auch in Console)
                const gpuInfoStr = JSON.stringify(gpuInfo, null, 2);
                console.log(`[PERFORMANCE] GPU-Info vollständig:`, gpuInfo);
                logger.logInfo(`[PERFORMANCE] GPU-Info vollständig (erste 500 Zeichen): ${gpuInfoStr.substring(0, 500)}`);
                
                // Prüfe auxAttributes für Hardware-Beschleunigung
                // displayType zeigt an, ob Hardware-Beschleunigung aktiv ist
                const displayType = auxAttributes.displayType || '';
                const hasHardwareAcceleration = 
                    displayType.includes('D3D') || 
                    displayType.includes('ANGLE') ||
                    displayType.includes('OPENGL') ||
                    auxAttributes.dx12FeatureLevel !== 'Not supported' ||
                    (auxAttributes.glImplementationParts && !auxAttributes.glImplementationParts.includes('gl=none'));
                
                // Prüfe auxAttributes für WebGL
                const glExtensions = auxAttributes.glExtensions || '';
                const hasWebGL = 
                    glExtensions.length > 0 ||
                    (auxAttributes.glImplementationParts && !auxAttributes.glImplementationParts.includes('gl=none'));
                
                // Prüfe auxAttributes für Video-Decode
                const hasVideoDecode = 
                    auxAttributes.jpegDecodeAcceleratorSupported === true ||
                    (auxAttributes.overlayInfo && auxAttributes.overlayInfo.nv12OverlaySupport !== 'NONE');
                
                // Fallback: Prüfe auch features (falls vorhanden)
                const hardwareAcceleration = hasHardwareAcceleration ||
                    features.gpu_compositing === 'enabled' || 
                    features.gpu_compositing === 'enabled_on' ||
                    features['2d_canvas'] === 'enabled' ||
                    features['2d_canvas'] === 'enabled_on';
                
                const webgl = hasWebGL ||
                    features.webgl === 'enabled' ||
                    features.webgl === 'enabled_on' ||
                    features.webgl2 === 'enabled' ||
                    features.webgl2 === 'enabled_on';
                
                const videoDecode = hasVideoDecode ||
                    features.video_decode === 'enabled' ||
                    features.video_decode === 'enabled_on' ||
                    features['video_decode_h264'] === 'enabled' ||
                    features['video_decode_h264'] === 'enabled_on';

                // Zusätzlich: Prüfe ob überhaupt Features vorhanden sind
                const hasAnyFeatures = Object.keys(features).length > 0 || Object.keys(auxAttributes).length > 0;
                const featureKeys = Object.keys(features);
                const auxAttributeKeys = Object.keys(auxAttributes);
                
                console.log(`[PERFORMANCE] GPU-Feature-Keys:`, featureKeys);
                console.log(`[PERFORMANCE] GPU-auxAttribute-Keys:`, auxAttributeKeys);
                console.log(`[PERFORMANCE] GPU-Features extrahiert: HW-Accel=${hardwareAcceleration}, WebGL=${webgl}, Video=${videoDecode}`);
                console.log(`[PERFORMANCE] GPU-Details: displayType="${displayType}", dx12="${auxAttributes.dx12FeatureLevel}", glExtensions=${glExtensions.length > 0 ? 'vorhanden' : 'keine'}`);
                logger.logInfo(`[PERFORMANCE] GPU-Feature-Keys: ${featureKeys.join(', ')}`);
                logger.logInfo(`[PERFORMANCE] GPU-auxAttribute-Keys: ${auxAttributeKeys.join(', ')}`);
                logger.logInfo(`[PERFORMANCE] GPU-Features extrahiert: HW-Accel=${hardwareAcceleration}, WebGL=${webgl}, Video=${videoDecode}`);

                metrics.gpu = {
                    auxAttributes: auxAttributes,
                    features: features,
                    hardwareAcceleration: hardwareAcceleration,
                    webgl: webgl,
                    videoDecode: videoDecode,
                    hasAnyFeatures: hasAnyFeatures,
                    featureKeys: featureKeys,
                    auxAttributeKeys: auxAttributeKeys,
                    displayType: displayType,
                    dx12FeatureLevel: auxAttributes.dx12FeatureLevel
                };
            }

            if (vramData) {
                metrics.vram = vramData;
            }
        } catch (err) {
            logger.logDebug(`[PERFORMANCE] GPU/VRAM-Sammlung fehlgeschlagen: ${err.message}`);
        }
        
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

        // Warnung bei hoher VRAM-Nutzung (wenn verfügbar)
        if (metrics.vram && metrics.vram.totalVRAM) {
            // Hinweis: Wir haben nur Total-VRAM, nicht die aktuelle Nutzung
            // Für echte Nutzung bräuchte man Performance Counters
            logger.logDebug(`[PERFORMANCE] GPU: ${metrics.vram.gpuName || 'Unbekannt'}, Total VRAM: ${metrics.vram.totalVRAM}MB`);
        }
        
        // Warnungen für Multi-Monitor-Performance (5+ Monitore)
        // Ermittle Anzahl aktiver Fenster (wenn verfügbar)
        let activeWindowCount = null;
        try {
            activeWindowCount = this.getActiveWindowCount ? this.getActiveWindowCount() : null;
        } catch (err) {
            // Callback-Fehler abfangen (z.B. wenn windowManager noch nicht bereit ist)
            logger.logDebug(`[PERFORMANCE] Fehler beim Ermitteln der Fenster-Anzahl: ${err.message}`);
        }
        
        if (activeWindowCount !== null && activeWindowCount >= 5) {
            const warnings = [];
            
            // Warnung: Niedriges VRAM bei vielen Monitoren
            if (metrics.vram && metrics.vram.totalVRAM && metrics.vram.totalVRAM < 2048) {
                warnings.push({
                    type: 'lowVRAM',
                    value: metrics.vram.totalVRAM,
                    message: `VRAM möglicherweise zu niedrig: ${metrics.vram.totalVRAM}MB für ${activeWindowCount} Monitore (empfohlen: ≥2GB)`,
                    severity: 'warning'
                });
            }
            
            // Warnung: GPU-Features deaktiviert bei vielen Monitoren
            if (metrics.gpu && !metrics.gpu.hardwareAcceleration) {
                warnings.push({
                    type: 'gpuDisabled',
                    value: activeWindowCount,
                    message: `GPU-Beschleunigung deaktiviert bei ${activeWindowCount} Monitoren - Performance kann beeinträchtigt sein`,
                    severity: 'critical'
                });
            }
            
            // Warnung: Sehr niedriges VRAM (< 1GB) bei vielen Monitoren
            if (metrics.vram && metrics.vram.totalVRAM && metrics.vram.totalVRAM < 1024) {
                warnings.push({
                    type: 'veryLowVRAM',
                    value: metrics.vram.totalVRAM,
                    message: `KRITISCH: VRAM sehr niedrig (${metrics.vram.totalVRAM}MB) für ${activeWindowCount} Monitore - System kann instabil werden`,
                    severity: 'critical'
                });
            }
            
            // Emitiere alle Warnungen
            warnings.forEach(warning => {
                this.emit('warning', warning);
                logger.logWarning(`[PERFORMANCE] ${warning.severity.toUpperCase()}: ${warning.message}`);
            });
            
            // Speichere Warnungen in Metriken für Dashboard
            if (warnings.length > 0) {
                metrics.multiMonitorWarnings = warnings;
            }
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
        
        const latest = stats.current;
        const gpuInfo = latest.gpu || null;
        const vramInfo = latest.vram || null;

        // Berechne GPU-Status
        let gpuStatus = 'unknown';
        if (gpuInfo) {
            if (gpuInfo.hardwareAcceleration && gpuInfo.webgl) {
                gpuStatus = 'enabled';
            } else {
                gpuStatus = 'partial';
            }
        }

        // Debug-Info für Dashboard
        const debugInfo = [];
        if (latest.gpu) {
            const gpu = latest.gpu;
            if (gpu.featureKeys && gpu.featureKeys.length > 0) {
                debugInfo.push(`GPU-Features gefunden: ${gpu.featureKeys.length} Keys`);
            }
            if (gpu.hasAnyFeatures && !gpu.hardwareAcceleration && !gpu.webgl && !gpu.videoDecode) {
                debugInfo.push(`GPU-Features vorhanden, aber nicht erkannt`);
            }
        }
        if (!vramInfo) {
            debugInfo.push(`VRAM-Abfrage: Keine Daten erhalten`);
        }
        
        // Multi-Monitor-Warnungen für Dashboard
        const multiMonitorWarnings = latest.multiMonitorWarnings || [];

        return {
            uptime: this.formatUptime(stats.uptime),
            currentMemory: `${stats.current.memory.heapUsed}MB`,
            averageMemory: `${stats.averageMemory}MB`,
            peakMemory: `${stats.peakMemory}MB`,
            status: this.getHealthStatus(stats),
            lastUpdate: new Date(stats.current.timestamp).toLocaleTimeString(),
            // GPU-Metriken
            gpu: {
                status: gpuStatus,
                hardwareAcceleration: gpuInfo?.hardwareAcceleration || false,
                webgl: gpuInfo?.webgl || false,
                videoDecode: gpuInfo?.videoDecode || false,
                featureKeys: gpuInfo?.featureKeys || [],
                hasAnyFeatures: gpuInfo?.hasAnyFeatures || false
            },
            vram: vramInfo ? {
                totalVRAM: `${vramInfo.totalVRAM}MB`,
                gpuName: vramInfo.gpuName || 'Unbekannt',
                // Hinweis: Aktuelle VRAM-Nutzung nicht verfügbar über WMI
                note: 'Nur Total-VRAM verfügbar (aktuelle Nutzung benötigt Performance Counters)'
            } : null,
            debugInfo: debugInfo.length > 0 ? debugInfo : null,
            multiMonitorWarnings: multiMonitorWarnings.length > 0 ? multiMonitorWarnings : null
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