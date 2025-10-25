// tests/HealthCheckManager.test.js
const os = require('os');
const { BrowserWindow } = require('electron');

// Mock electron modules
jest.mock('electron', () => ({
    app: {
        on: jest.fn()
    },
    BrowserWindow: {
        getAllWindows: jest.fn(() => [])
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

// Mock os module
jest.mock('os');

describe('HealthCheckManager', () => {
    let healthCheck;
    let HealthCheckManager;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        
        // Setup os mocks
        os.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16GB
        os.freemem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
        os.cpus.mockReturnValue([
            { model: 'Intel Core i7', speed: 2400, times: { user: 100, idle: 100, sys: 100, nice: 0, irq: 0 } },
            { model: 'Intel Core i7', speed: 2400, times: { user: 100, idle: 100, sys: 100, nice: 0, irq: 0 } }
        ]);
        os.networkInterfaces.mockReturnValue({
            eth0: [
                { internal: false, family: 'IPv4', address: '192.168.1.100', mac: '00:00:00:00:00:00' }
            ]
        });
        os.platform.mockReturnValue('win32');
        os.arch.mockReturnValue('x64');
        os.release.mockReturnValue('10.0.19041');
        os.hostname.mockReturnValue('TEST-PC');

        HealthCheckManager = require('../modules/HealthCheckManager');
        healthCheck = HealthCheckManager.init();
    });

    afterEach(() => {
        if (healthCheck) {
            healthCheck.stopMonitoring();
        }
    });

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            expect(healthCheck).toBeDefined();
            expect(healthCheck.startTime).toBeDefined();
            expect(healthCheck.checks).toBeDefined();
        });

        test('should return same instance on multiple init calls', () => {
            const instance1 = HealthCheckManager.init();
            const instance2 = HealthCheckManager.init();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Memory Check', () => {
        test('should check memory usage', () => {
            const memoryInfo = healthCheck.checkMemory();

            expect(memoryInfo).toBeDefined();
            expect(memoryInfo.process).toBeDefined();
            expect(memoryInfo.system).toBeDefined();
            expect(memoryInfo.status).toBeDefined();
        });

        test('should format bytes correctly', () => {
            expect(healthCheck.formatBytes(0)).toBe('0 B');
            expect(healthCheck.formatBytes(1024)).toBe('1 KB');
            expect(healthCheck.formatBytes(1024 * 1024)).toBe('1 MB');
            expect(healthCheck.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
        });

        test('should detect high memory usage', () => {
            os.freemem.mockReturnValue(1 * 1024 * 1024 * 1024); // Only 1GB free
            const memoryInfo = healthCheck.checkMemory();

            expect(memoryInfo.system.percentUsed).toBeGreaterThan(85);
            expect(memoryInfo.status).toBe('warning');
        });
    });

    describe('CPU Check', () => {
        test('should check CPU usage', () => {
            const cpuInfo = healthCheck.checkCPU();

            expect(cpuInfo).toBeDefined();
            expect(cpuInfo.count).toBe(2);
            expect(cpuInfo.model).toBe('Intel Core i7');
            expect(cpuInfo.speed).toBe('2400 MHz');
            expect(cpuInfo.load).toBeDefined();
            expect(cpuInfo.status).toBeDefined();
        });
    });

    describe('Network Check', () => {
        test('should check network status', () => {
            const networkInfo = healthCheck.checkNetwork();

            expect(networkInfo).toBeDefined();
            expect(networkInfo.online).toBe(true);
            expect(networkInfo.interfaces.length).toBeGreaterThan(0);
            expect(networkInfo.status).toBe('healthy');
        });

        test('should detect offline status', () => {
            os.networkInterfaces.mockReturnValue({});
            const networkInfo = healthCheck.checkNetwork();

            expect(networkInfo.online).toBe(false);
            expect(networkInfo.status).toBe('offline');
        });
    });

    describe('Display Check', () => {
        test('should check displays with no windows', async () => {
            BrowserWindow.getAllWindows.mockReturnValue([]);
            const displayStats = await healthCheck.checkDisplays();

            expect(displayStats.total).toBe(0);
            expect(displayStats.active).toBe(0);
            expect(displayStats.displays).toEqual([]);
        });

        test('should check displays with active windows', async () => {
            const mockWindow = {
                id: 1,
                getTitle: jest.fn(() => 'TTQuotes Display 1'),
                webContents: {
                    isLoading: jest.fn(() => false),
                    getURL: jest.fn(() => 'https://example.com'),
                    isCrashed: jest.fn(() => false)
                },
                isVisible: jest.fn(() => true),
                isMinimized: jest.fn(() => false),
                isDestroyed: jest.fn(() => false),
                getBounds: jest.fn(() => ({ x: 0, y: 0, width: 1920, height: 1080 }))
            };

            BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
            const displayStats = await healthCheck.checkDisplays();

            expect(displayStats.total).toBe(1);
            expect(displayStats.active).toBe(1);
            expect(displayStats.displays[0].status).toBe('active');
        });
    });

    describe('Uptime', () => {
        test('should calculate uptime correctly', () => {
            const uptime = healthCheck.getUptime();
            expect(uptime).toBeDefined();
            expect(typeof uptime).toBe('string');
        });
    });

    describe('System Info', () => {
        test('should get system information', () => {
            const sysInfo = healthCheck.getSystemInfo();

            expect(sysInfo).toBeDefined();
            expect(sysInfo.platform).toBe('win32');
            expect(sysInfo.arch).toBe('x64');
            expect(sysInfo.hostname).toBe('TEST-PC');
            expect(sysInfo.cpus).toBe(2);
        });
    });

    describe('Health Check', () => {
        test('should perform complete health check', async () => {
            const health = await healthCheck.performHealthCheck();

            expect(health).toBeDefined();
            expect(health.timestamp).toBeDefined();
            expect(health.uptime).toBeDefined();
            expect(health.displays).toBeDefined();
            expect(health.memory).toBeDefined();
            expect(health.cpu).toBeDefined();
            expect(health.network).toBeDefined();
            expect(health.errors).toBeDefined();
            expect(health.overall).toBeDefined();
        });

        test('should calculate overall status as healthy', async () => {
            const health = await healthCheck.performHealthCheck();

            expect(health.overall.status).toBeDefined();
            expect(['healthy', 'warning', 'critical']).toContain(health.overall.status);
        });
    });

    describe('Monitoring', () => {
        test('should start monitoring', () => {
            jest.useFakeTimers();
            healthCheck.startMonitoring(1000);

            expect(healthCheck.checkInterval).toBeDefined();

            healthCheck.stopMonitoring();
            jest.useRealTimers();
        });

        test('should stop monitoring', () => {
            jest.useFakeTimers();
            healthCheck.startMonitoring(1000);
            healthCheck.stopMonitoring();

            expect(healthCheck.checkInterval).toBeNull();
            jest.useRealTimers();
        });

        test('should not start monitoring twice', () => {
            jest.useFakeTimers();
            healthCheck.startMonitoring(1000);
            healthCheck.startMonitoring(1000);

            healthCheck.stopMonitoring();
            jest.useRealTimers();
        });
    });

    describe('Subscribers', () => {
        test('should subscribe and notify', async () => {
            const callback = jest.fn();
            healthCheck.subscribe(callback);

            await healthCheck.performHealthCheck();

            expect(callback).toHaveBeenCalled();
        });

        test('should unsubscribe', async () => {
            const callback = jest.fn();
            healthCheck.subscribe(callback);
            healthCheck.unsubscribe(callback);

            await healthCheck.performHealthCheck();

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('getInstance', () => {
        test('should throw error if not initialized', () => {
            jest.resetModules();
            const HealthCheckManagerNew = require('../modules/HealthCheckManager');
            
            expect(() => {
                HealthCheckManagerNew.getInstance();
            }).toThrow('HealthCheckManager not initialized');
        });

        test('should return instance if initialized', () => {
            const instance = HealthCheckManager.getInstance();
            expect(instance).toBe(healthCheck);
        });
    });
});

