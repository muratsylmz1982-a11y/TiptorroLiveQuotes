// tests/ErrorHandler.test.js
const { app } = require('electron');

// Mock electron modules
jest.mock('electron', () => ({
    app: {
        on: jest.fn(),
        relaunch: jest.fn(),
        exit: jest.fn(),
        getPath: jest.fn(() => '/mock/path')
    },
    dialog: {
        showErrorBox: jest.fn(),
        showMessageBox: jest.fn()
    }
}));

// Mock logger
jest.mock('../modules/logger', () => ({
    logSuccess: jest.fn(),
    logInfo: jest.fn(),
    logWarning: jest.fn(),
    logError: jest.fn(),
    logDebug: jest.fn()
}));

describe('ErrorHandler', () => {
    let errorHandler;
    let ErrorHandler;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset module cache
        jest.resetModules();
        ErrorHandler = require('../modules/ErrorHandler');
        errorHandler = ErrorHandler.init();
    });

    afterEach(() => {
        // Clear error log after each test
        if (errorHandler) {
            errorHandler.clearErrorLog();
            errorHandler.resetErrorCount();
        }
    });

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(errorHandler).toBeDefined();
            expect(errorHandler.errorCount).toBe(0);
            expect(errorHandler.errorLog).toEqual([]);
        });

        test('should register all error handlers', () => {
            expect(app.on).toHaveBeenCalledWith('render-process-gone', expect.any(Function));
            expect(app.on).toHaveBeenCalledWith('child-process-gone', expect.any(Function));
            expect(app.on).toHaveBeenCalledWith('gpu-process-crashed', expect.any(Function));
            expect(app.on).toHaveBeenCalledWith('web-contents-created', expect.any(Function));
        });

        test('should return same instance on multiple init calls', () => {
            const instance1 = ErrorHandler.init();
            const instance2 = ErrorHandler.init();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Error Logging', () => {
        test('should log uncaught exceptions', () => {
            const error = new Error('Test error');
            errorHandler.handleUncaughtException(error, 'test-origin');

            expect(errorHandler.errorLog.length).toBe(1);
            expect(errorHandler.errorLog[0].type).toBe('uncaughtException');
            expect(errorHandler.errorLog[0].message).toBe('Test error');
            expect(errorHandler.errorCount).toBe(1);
        });

        test('should log unhandled rejections', () => {
            const reason = 'Promise rejection reason';
            errorHandler.handleUnhandledRejection(reason, Promise.resolve());

            expect(errorHandler.errorLog.length).toBe(1);
            expect(errorHandler.errorLog[0].type).toBe('unhandledRejection');
            expect(errorHandler.errorCount).toBe(1);
        });

        test('should track multiple errors', () => {
            errorHandler.handleUncaughtException(new Error('Error 1'), 'origin1');
            errorHandler.handleUncaughtException(new Error('Error 2'), 'origin2');
            errorHandler.handleUnhandledRejection('Rejection 1', Promise.resolve());

            expect(errorHandler.errorLog.length).toBe(3);
            expect(errorHandler.errorCount).toBe(3);
        });
    });

    describe('Error Statistics', () => {
        test('should return correct stats', () => {
            errorHandler.handleUncaughtException(new Error('Error 1'), 'origin');
            errorHandler.handleUnhandledRejection('Rejection 1', Promise.resolve());

            const stats = errorHandler.getStats();

            expect(stats.totalErrors).toBe(2);
            expect(stats.errorTypes.uncaughtException).toBe(1);
            expect(stats.errorTypes.unhandledRejection).toBe(1);
            expect(stats.recentErrors.length).toBe(2);
        });

        test('should limit recent errors to 5', () => {
            for (let i = 0; i < 10; i++) {
                errorHandler.handleUncaughtException(new Error(`Error ${i}`), 'origin');
            }

            const stats = errorHandler.getStats();
            expect(stats.recentErrors.length).toBe(5);
        });
    });

    describe('Error Management', () => {
        test('should reset error count', () => {
            errorHandler.handleUncaughtException(new Error('Error'), 'origin');
            expect(errorHandler.errorCount).toBe(1);

            errorHandler.resetErrorCount();
            expect(errorHandler.errorCount).toBe(0);
        });

        test('should clear error log', () => {
            errorHandler.handleUncaughtException(new Error('Error'), 'origin');
            expect(errorHandler.errorLog.length).toBe(1);

            errorHandler.clearErrorLog();
            expect(errorHandler.errorLog.length).toBe(0);
        });

        test('should get error log', () => {
            errorHandler.handleUncaughtException(new Error('Error'), 'origin');
            const log = errorHandler.getErrorLog();

            expect(log).toEqual(errorHandler.errorLog);
            expect(log.length).toBe(1);
        });
    });

    describe('getInstance', () => {
        test('should throw error if not initialized', () => {
            jest.resetModules();
            const ErrorHandlerNew = require('../modules/ErrorHandler');
            
            expect(() => {
                ErrorHandlerNew.getInstance();
            }).toThrow('ErrorHandler not initialized');
        });

        test('should return instance if initialized', () => {
            const instance = ErrorHandler.getInstance();
            expect(instance).toBe(errorHandler);
        });
    });
});

