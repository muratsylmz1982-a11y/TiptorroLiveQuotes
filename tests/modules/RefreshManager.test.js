// tests/modules/RefreshManager.test.js

// Mock BrowserWindow aus Test-Utils
const { MockBrowserWindow } = require('../utils/testUtils');
const RefreshManager = require('../../modules/RefreshManager');

describe('RefreshManager Smoke Test', () => {
    let refreshManager;
    let mockWin1, mockWin2;
    
    beforeEach(() => {
        refreshManager = new RefreshManager();
        mockWin1 = new MockBrowserWindow({ width: 800, height: 600 });
        mockWin2 = new MockBrowserWindow({ width: 1024, height: 768 });
    });
    
    afterEach(() => {
        // Stoppt Intervalle
        refreshManager.cleanup();
    });
    
    test('sollte instanziiert werden und Eigenschaften korrekt setzen', () => {
        expect(refreshManager).toBeDefined();
        expect(refreshManager.isRunning).toBe(false);
        expect(Array.isArray(refreshManager.windows)).toBe(true);
    });
    
    test('sollte Fenster hinzufügen und startCoordinatedRefresh ausführen', () => {
        refreshManager.addWindow(mockWin1, { url: 'https://example.com', refreshDelay: 0 });
        refreshManager.addWindow(mockWin2, { url: 'https://example.org', refreshDelay: 100 });
        
        expect(refreshManager.windows.length).toBe(2);
        
        // Startet das zentrale Intervall (30s)
        refreshManager.startCoordinatedRefresh();
        expect(refreshManager.isRunning).toBe(true);
        
        // Aufruf von refreshAllWindows soll keine Fehler werfen
        expect(() => refreshManager.refreshAllWindows()).not.toThrow();
    });
    
    test('sollte cleanup ohne Fehler durchführen', () => {
        // Füge Fenster hinzu
        refreshManager.addWindow(mockWin1);
        refreshManager.startCoordinatedRefresh();
        
        // cleanup stoppt Intervalle und leert Arrays
        expect(() => refreshManager.cleanup()).not.toThrow();
        expect(refreshManager.windows.length).toBe(0);
        expect(refreshManager.isRunning).toBe(false);
    });
});
