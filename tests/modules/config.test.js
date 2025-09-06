// tests/modules/config.test.js
const fs = require('fs');
const path = require('path');
const config = require('../../modules/config');
const { MockApp } = require('../utils/testUtils');

 // Unterdrücke console.warn und console.log während Tests
 beforeAll(() => {
     jest.spyOn(console, 'warn').mockImplementation(() => {});
     jest.spyOn(console, 'log').mockImplementation(() => {});
 });

 afterAll(() => {
     console.warn.mockRestore();
     console.log.mockRestore();
 });
 // Unterdrücke console.warn und console.log während Tests
 let warnSpy, logSpy;
 beforeAll(() => {
     warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
     logSpy  = jest.spyOn(console, 'log').mockImplementation(() => {});
 });

 afterAll(() => {
     warnSpy.mockRestore();
     logSpy.mockRestore();
 });


describe('Config Module', () => {
    let mockApp;
    let testConfigPath;
    
    beforeEach(() => {
        mockApp = new MockApp();
        testConfigPath = path.join(mockApp.getPath('userData'), 'config.json');
        
        // Stelle sicher dass test-data Ordner existiert
        const testDataDir = mockApp.getPath('userData');
        if (!fs.existsSync(testDataDir)) {
            fs.mkdirSync(testDataDir, { recursive: true });
        }
    });
    
    afterEach(() => {
        // Cleanup: Test-Config löschen
        if (fs.existsSync(testConfigPath)) {
            fs.unlinkSync(testConfigPath);
        }
    });
    
    test('sollte leere Konfiguration zurückgeben wenn keine Datei existiert', () => {
        const result = config.loadConfig(mockApp);
        expect(result).toEqual([]);
    });
    
    test('sollte Konfiguration speichern und laden', () => {
        const testConfig = [
            { monitorIndex: 0, url: 'https://example.com' },
            { monitorIndex: 1, url: 'https://google.com' }
        ];
        
        const saveResult = config.saveConfig(mockApp, testConfig);
        expect(saveResult).toBe(true);
        
        const loadResult = config.loadConfig(mockApp);
        expect(loadResult).toEqual(testConfig);
    });
    
    test('sollte ungültige Konfiguration validieren', () => {
        const invalidConfig = [
            { monitorIndex: 0, url: 'https://valid.com' },
            { monitorIndex: 'invalid', url: 'not-a-url' },
            { url: 'https://missing-index.com' },
            { monitorIndex: 2, url: 'ftp://unsafe-protocol.com' }
        ];
        
        const validatedConfig = config.validateConfig(invalidConfig);
        
        expect(validatedConfig).toHaveLength(1);
        expect(validatedConfig[0]).toEqual({ monitorIndex: 0, url: 'https://valid.com' });
    });
    
    test('sollte Config-Migration durchführen', () => {
        const oldConfig = [
            { monitorId: 123, url: 'https://example.com' }
        ];
        
        const displays = [
            { id: 456, bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
            { id: 123, bounds: { x: 1920, y: 0, width: 1920, height: 1080 } }
        ];
        
        const migratedConfig = config.migrateConfigFormat(oldConfig, displays);
        
        expect(migratedConfig[0]).toEqual({ 
            monitorIndex: 1, 
            url: 'https://example.com' 
        });
    });
});