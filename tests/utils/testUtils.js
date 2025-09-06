// tests/utils/testUtils.js
const path = require('path');

// Mock Electron App für Tests
class MockApp {
    constructor() {
        this.paths = {
            'userData': path.join(__dirname, 'test-data')
        };
    }
    
    getPath(name) {
        return this.paths[name] || '/tmp';
    }
}

// Mock BrowserWindow
class MockBrowserWindow {
    constructor(options = {}) {
        this.id = Math.floor(Math.random() * 10000);
        this.options = options;
        this.destroyed = false;
        this.listeners = {};
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    removeAllListeners() {
        this.listeners = {};
    }
    
    isDestroyed() {
        return this.destroyed;
    }
    
    destroy() {
        this.destroyed = true;
        if (this.listeners.closed) {
            this.listeners.closed.forEach(callback => callback());
        }
    }
    
    close() {
        this.destroy();
    }
}

module.exports = {
    MockApp,
    MockBrowserWindow
};