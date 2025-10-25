// health-check-dashboard.client.js

let isMonitoring = false;
let monitoringInterval = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadHealth();
    loadSystemInfo();
    
    // Button Event Listeners
    document.getElementById('btnRefresh').addEventListener('click', loadHealth);
    document.getElementById('btnToggleMonitoring').addEventListener('click', toggleMonitoring);
    document.getElementById('btnClearErrors').addEventListener('click', clearErrors);
});

/**
 * Load current health status
 */
async function loadHealth() {
    try {
        const health = await window.electronAPI.invoke('health-check:get-status');
        
        if (health && !health.error) {
            updateUI(health);
        } else {
            console.error('Health check failed:', health?.error);
        }
    } catch (error) {
        console.error('Failed to load health:', error);
    }
}

/**
 * Load system information
 */
async function loadSystemInfo() {
    try {
        const sysInfo = await window.electronAPI.invoke('health-check:get-system-info');
        
        if (sysInfo && !sysInfo.error) {
            renderSystemInfo(sysInfo);
        }
    } catch (error) {
        console.error('Failed to load system info:', error);
    }
}

/**
 * Toggle monitoring on/off
 */
async function toggleMonitoring() {
    const btn = document.getElementById('btnToggleMonitoring');
    
    if (!isMonitoring) {
        // Start monitoring
        const result = await window.electronAPI.invoke('health-check:start-monitoring', 5000);
        if (result.success) {
            isMonitoring = true;
            btn.textContent = '⏸️ Monitoring stoppen';
            btn.classList.remove('secondary');
            
            // Start local refresh interval
            monitoringInterval = setInterval(loadHealth, 5000);
        }
    } else {
        // Stop monitoring
        const result = await window.electronAPI.invoke('health-check:stop-monitoring');
        if (result.success) {
            isMonitoring = false;
            btn.textContent = '▶️ Monitoring starten';
            btn.classList.add('secondary');
            
            // Clear local interval
            if (monitoringInterval) {
                clearInterval(monitoringInterval);
                monitoringInterval = null;
            }
        }
    }
}

/**
 * Clear error log
 */
async function clearErrors() {
    const confirm = window.confirm('Möchten Sie wirklich alle Fehler löschen?');
    if (!confirm) return;
    
    const result = await window.electronAPI.invoke('error-handler:clear-log');
    if (result.success) {
        loadHealth();
        document.getElementById('errorLog').innerHTML = '<div class="empty-state">Keine Fehler erfasst ✅</div>';
    }
}

/**
 * Update UI with health data
 */
function updateUI(health) {
    // Overall Status
    updateOverallStatus(health.overall);
    
    // Uptime
    document.getElementById('uptime').textContent = health.uptime || '-';
    
    // Display Stats
    const displays = health.displays;
    document.getElementById('displayCount').textContent = displays.total || 0;
    document.getElementById('displayActive').textContent = displays.active || 0;
    document.getElementById('displayErrors').textContent = displays.crashed || 0;
    
    // Memory
    document.getElementById('memoryUsage').textContent = health.memory.process?.heapUsed || '-';
    document.getElementById('memoryPercent').textContent = health.memory.system?.percentUsed || '0';
    
    // CPU
    document.getElementById('cpuLoad').textContent = health.cpu.load ? `${health.cpu.load}%` : '-';
    document.getElementById('cpuCores').textContent = health.cpu.count || '-';
    
    // Network
    const networkIcon = health.network.online ? '✅ Online' : '❌ Offline';
    document.getElementById('networkStatus').textContent = networkIcon;
    document.getElementById('networkInterfaces').textContent = health.network.count || 0;
    
    // Errors
    document.getElementById('errorCount').textContent = health.errors.totalErrors || 0;
    
    // Render displays
    renderDisplays(displays.displays);
    
    // Render error log
    renderErrorLog(health.errors);
}

/**
 * Update overall status badge
 */
function updateOverallStatus(overall) {
    const badge = document.getElementById('overallStatus');
    const status = overall.status || 'unknown';
    
    // Remove all status classes
    badge.className = 'status-badge';
    
    // Add appropriate class
    badge.classList.add(`status-${status}`);
    
    // Update text
    badge.textContent = status.toUpperCase();
    
    // Show issues if any
    if (overall.issues && overall.issues.length > 0) {
        console.warn('Critical Issues:', overall.issues);
    }
    if (overall.warnings && overall.warnings.length > 0) {
        console.warn('Warnings:', overall.warnings);
    }
}

/**
 * Render display cards
 */
function renderDisplays(displays) {
    const grid = document.getElementById('displayGrid');
    
    if (!displays || displays.length === 0) {
        grid.innerHTML = '<div class="empty-state">Keine Monitore aktiv</div>';
        return;
    }
    
    grid.innerHTML = displays.map(display => `
        <div class="display-card">
            <div class="display-header">
                <div class="display-title">${escapeHtml(display.title)}</div>
                <div class="display-status ${display.status}">${display.status.toUpperCase()}</div>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">ID:</span>
                    <span class="info-value">${display.id}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Sichtbar:</span>
                    <span class="info-value">${display.isVisible ? '✅ Ja' : '❌ Nein'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Minimiert:</span>
                    <span class="info-value">${display.isMinimized ? '✅ Ja' : '❌ Nein'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Position:</span>
                    <span class="info-value">${display.bounds.x}, ${display.bounds.y}</span>
                </div>
            </div>
            <div class="display-url" title="${escapeHtml(display.url)}">${escapeHtml(display.url)}</div>
        </div>
    `).join('');
}

/**
 * Render system info
 */
function renderSystemInfo(sysInfo) {
    const container = document.getElementById('systemInfo');
    
    container.innerHTML = `
        <div class="info-item">
            <span class="info-label">Plattform:</span>
            <span class="info-value">${sysInfo.platform}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Architektur:</span>
            <span class="info-value">${sysInfo.arch}</span>
        </div>
        <div class="info-item">
            <span class="info-label">OS Release:</span>
            <span class="info-value">${sysInfo.release}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Hostname:</span>
            <span class="info-value">${sysInfo.hostname}</span>
        </div>
        <div class="info-item">
            <span class="info-label">CPU Kerne:</span>
            <span class="info-value">${sysInfo.cpus}</span>
        </div>
        <div class="info-item">
            <span class="info-label">RAM Total:</span>
            <span class="info-value">${sysInfo.memory}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Electron:</span>
            <span class="info-value">${sysInfo.electron}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Node.js:</span>
            <span class="info-value">${sysInfo.node}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Chrome:</span>
            <span class="info-value">${sysInfo.chrome}</span>
        </div>
    `;
}

/**
 * Render error log
 */
function renderErrorLog(errors) {
    const container = document.getElementById('errorLog');
    
    if (!errors.recentErrors || errors.recentErrors === 0) {
        container.innerHTML = '<div class="empty-state">Keine Fehler erfasst ✅</div>';
        return;
    }
    
    // Fetch full error log
    window.electronAPI.invoke('error-handler:get-log').then(errorLog => {
        if (!errorLog || errorLog.length === 0) {
            container.innerHTML = '<div class="empty-state">Keine Fehler erfasst ✅</div>';
            return;
        }
        
        // Show last 10 errors
        const recentErrors = errorLog.slice(-10).reverse();
        
        container.innerHTML = recentErrors.map(error => `
            <div class="error-entry">
                <div class="error-type">${error.type}</div>
                <div class="error-message">${escapeHtml(error.message || error.reason || 'Unknown error')}</div>
                <div class="error-timestamp">${new Date(error.timestamp).toLocaleString('de-DE')}</div>
            </div>
        `).join('');
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
});

