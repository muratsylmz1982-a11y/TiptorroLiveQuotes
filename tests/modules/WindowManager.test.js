// tests/modules/WindowManager.test.js

// Mock BrowserWindow inline
jest.mock('electron', () => {
    class MockBrowserWindow {
        constructor(options = {}) {
            this.id = Math.floor(Math.random() * 10000);
            this.options = options;
            this.destroyed = false;
            this.listeners = {};
            this.webContents = {
                isLoading: () => false,
                getURL: () => 'file://test.html',
                send: () => {},
                executeJavaScript: () => Promise.resolve(),
                reload: () => {},
                setBackgroundThrottling: () => {}
            };
        }
        on(event, cb) {
            (this.listeners[event] = this.listeners[event] || []).push(cb);
        }
        removeAllListeners() { this.listeners = {}; }
        isDestroyed() { return this.destroyed; }
        destroy() {
            this.destroyed = true;
            (this.listeners.closed || []).forEach(cb => cb());
        }
        close() { this.destroy(); }
        focus() {}
        show() {}
        hide() {}
        getPosition() { return [0, 0]; }
        getSize() { return [800, 600]; }
    }
    return { BrowserWindow: MockBrowserWindow };
});

const WindowManager = require('../../modules/WindowManager');

describe('WindowManager', () => {
    let windowManager;

    beforeEach(() => {
        windowManager = new WindowManager();
    });

    afterEach(() => {
        windowManager.cleanup();
    });

    test('Initialisierung: Status-Objekt enthält windows, overlays, liveWindows', () => {
        const status = windowManager.getStatus();
        expect(status).toHaveProperty('windows');
        expect(status).toHaveProperty('overlays');
        expect(status).toHaveProperty('liveWindows');
        expect(status.windows).toBe(0);
        expect(status.overlays).toBe(0);
        expect(status.liveWindows).toBe(0);
    });

    test('Overlay-Fenster: Erstellung und Tracking', () => {
        const overlay = windowManager.createOverlay({ width: 800, height: 600 });
        expect(overlay.id).toBeDefined();
        expect(windowManager.getStatus().overlays).toBe(1);
    });

    test('Overlay-Schließen reduziert overlay-Zähler', () => {
        const overlay = windowManager.createOverlay({ width: 800, height: 600 });
        expect(windowManager.getStatus().overlays).toBe(1);
        overlay.close();
        expect(windowManager.getStatus().overlays).toBe(0);
    });

    test('Live-Window: Erstellung und Tracking', () => {
        const live = windowManager.createLiveWindow({ width: 1920, height: 1080 });
        expect(live.id).toBeDefined();
        expect(windowManager.getStatus().liveWindows).toBe(1);
    });

    test('Cleanup: Alle Fenster werden zerstört', () => {
        const overlay = windowManager.createOverlay({ width: 800, height: 600 });
        const live = windowManager.createLiveWindow({ width: 1920, height: 1080 });
        windowManager.cleanup();
        expect(overlay.isDestroyed()).toBe(true);
        expect(live.isDestroyed()).toBe(true);
        expect(windowManager.getStatus().overlays).toBe(0);
        expect(windowManager.getStatus().liveWindows).toBe(0);
    });

    test('Error-Handling: Bereits zerstörtes Fenster ignorieren', () => {
        const overlay = windowManager.createOverlay({ width: 800, height: 600 });
        overlay.destroyed = true;
        expect(() => windowManager.closeAllOverlays()).not.toThrow();
    });
});

