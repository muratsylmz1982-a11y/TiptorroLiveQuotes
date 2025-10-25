// modules/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Logs-Ordner erstellen falls nicht vorhanden
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Alte Logs bereinigen (älter als 7 Tage)
function cleanupOldLogs() {
    try {
        const files = fs.readdirSync(logsDir);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 Tage in Millisekunden
        
        let deletedCount = 0;
        
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtime.getTime();
            
            // Lösche Dateien älter als 7 Tage
            if (fileAge > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
                // Verwende winston logger nicht hier (würde zirkulär werden), benutze console direkt
                console.log(`[LOG-CLEANUP] Alte Log-Datei gelöscht: ${file}`);
            }
        });
        
        if (deletedCount > 0) {
            // Verwende winston logger nicht hier (würde zirkulär werden), benutze console direkt
            console.log(`[LOG-CLEANUP] ${deletedCount} alte Log-Datei(en) gelöscht`);
        }
    } catch (error) {
        // Verwende winston logger nicht hier (würde zirkulär werden), benutze console direkt
        console.error('[LOG-CLEANUP] Fehler beim Bereinigen alter Logs:', error.message);
    }
}

// Cleanup beim Start
cleanupOldLogs();

// Logger-Konfiguration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
        })
    ),
    transports: [
        // Fehler-Log (nur Errors)
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        // Kombiniertes Log (alle Level)
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        // Console-Output (nur in Development)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

logger.info('📝 Logger initialisiert mit automatischer Log-Rotation (7 Tage, 10MB pro Datei)');

// Hilfsfunktionen
logger.logError = (message, error) => {
    logger.error(`${message}${error ? ': ' + error.message : ''}`, { 
        stack: error?.stack,
        timestamp: new Date().toISOString()
    });
};

logger.logInfo = (message, data = null) => {
    logger.info(`ℹ️  ${message}${data ? ' | ' + JSON.stringify(data) : ''}`);
};

logger.logSuccess = (message) => {
    logger.info(`✅ ${message}`);
};

logger.logWarning = (message, data = null) => {
    logger.warn(`⚠️ ${message}${data ? ' | ' + JSON.stringify(data) : ''}`);
};

logger.logDebug = (message, data = null) => {
    logger.debug(`🔍 ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}`);
};

module.exports = logger;
