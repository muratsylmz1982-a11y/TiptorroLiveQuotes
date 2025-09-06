// modules/logger.js
const winston = require('winston');
const path = require('path');

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
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Kombiniertes Log (alle Level)
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
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

// Logs-Ordner erstellen falls nicht vorhanden
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info('📁 Logs-Ordner erstellt');
}

// Hilfsfunktionen
logger.logError = (message, error) => {
    logger.error(`${message}${error ? ': ' + error.message : ''}`, { 
        stack: error?.stack,
        timestamp: new Date().toISOString()
    });
};

logger.logSuccess = (message) => {
    logger.info(`✅ ${message}`);
};

logger.logWarning = (message) => {
    logger.warn(`⚠️ ${message}`);
};

logger.logDebug = (message, data = null) => {
    logger.debug(`🔍 ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}`);
};

module.exports = logger;
