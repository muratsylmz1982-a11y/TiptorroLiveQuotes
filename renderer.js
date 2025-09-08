let displays = [];
let favorites = [];

// Status-Banner Funktionen
function showStatus(message, type = 'info', duration = 5000) {
  const banner = document.getElementById('status-banner');
  const messageEl = document.getElementById('status-message');
  const closeBtn = document.getElementById('status-close');
  
  if (!banner || !messageEl) return;
  
  // Klassen zurücksetzen
  banner.className = 'status-banner';
  
  // Typ-spezifische Klasse hinzufügen
  if (type === 'error') banner.classList.add('error');
  if (type === 'warning') banner.classList.add('warning');
  
  messageEl.textContent = message;
  banner.hidden = false;
  banner.classList.add('visible');
  
  // Close-Handler
  closeBtn.onclick = () => hideStatus();
  
  // Auto-Hide nach duration
  if (duration > 0) {
    setTimeout(() => hideStatus(), duration);
  }
}

function hideStatus() {
  const banner = document.getElementById('status-banner');
  if (banner) {
    banner.classList.remove('visible');
    setTimeout(() => banner.hidden = true, 300);
  }
}
// Lightweight toast helper (no deps)
function toast(message, duration = 3000) {
  try {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = 'position:fixed;right:16px;bottom:16px;padding:10px 14px;border-radius:10px;background:#222;color:#fff;font:14px/1.2 system-ui;box-shadow:0 6px 20px rgba(0,0,0,.2);z-index:9999;opacity:.98';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
  } catch {}
}

window.addEventListener('DOMContentLoaded', async () => {
    displays = await window.electronAPI.getDisplays();
    favorites = await window.electronAPI.getFavorites();
    try { showAllowlistBadge(); } catch {};

    if (!Array.isArray(favorites)) favorites = [];

 // NEU: Gespeicherte Konfiguration laden
    const savedConfig = await window.electronAPI.getCurrentConfig();

    const container = document.getElementById('config-container');
    container.innerHTML = '';

    function createConfigBlock(index) {
        const block = document.createElement('div');
        block.classList.add('display-section');

        const display = displays[index];
        const monitorName = `TV-Gerät ${index + 1}`;
        const monitorSpecs = `1920 × 1080`;
        const monitorType = index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Extended';

        const favoriteOptions = [
            { name: '— Favorit wählen —', url: '' },
            ...favorites
        ]
            .map(f => `<option value="${f.url}">${f.name}</option>`)
            .join('');

        block.innerHTML = `
            <div class="monitor-info">
                <h3 class="monitor-name">${monitorName}</h3>
                <div class="monitor-specs">${monitorSpecs} • ${monitorType}</div>
            </div>
            <div class="field-group">
                <div class="field">
                    <span>Favorit</span>
                    <select class="favorite-select" data-monitor="${index}">
                        ${favoriteOptions}
                    </select>
                </div>
                <div class="field">
                    <span>URL</span>
                    <input
                        type="url"
                        class="url-input"
                        placeholder="https://example.com"
                        data-monitor="${index}"
                    >
                </div>
            </div>
            <div class="preview-controls">
                <button class="toggle-preview" type="button" data-monitor="${index}">
                    Vorschau
                </button>
            </div>
        `;

                        // NEU: gespeicherten Wert setzen + Favoriten-Dropdown auswählen
        if (Array.isArray(savedConfig)) {
            const found = savedConfig.find(cfg => cfg.monitorIndex === index && cfg.url);
            if (found) {
                const urlInput = block.querySelector(`input[data-monitor="${index}"]`);
                const select = block.querySelector(`select[data-monitor="${index}"]`);
                if (urlInput) urlInput.value = found.url;
                if (select) {
                    // Wenn ein Favorit die URL hat, diesen in der Auswahl wählen
                    const favMatch = favorites.find(f => f.url === found.url);
                    if (favMatch) {
                        select.value = favMatch.url;
                    } else {
                        // Falls kein Favorit passt, auf "— Favorit wählen —" lassen
                        select.value = '';
                    }
                }
            }
        }

        return block;
    }

    for (let i = 0; i < displays.length; i++) {
        container.appendChild(createConfigBlock(i));
    }

    setupEventListeners();
    updateDisplayCounts();
});

// IPC-Event empfangen und alle URL-Felder leeren + Dropdowns zurücksetzen
window.electronAPI.onConfigCleared(() => {
    console.log('Config wurde gelöscht – Felder leeren...');
    document.querySelectorAll('.url-input').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('.favorite-select').forEach(select => {
        select.value = '';
    });
    // Optional Anzeige-Zähler updaten
    updateDisplayCounts();
});

// ------------------- EVENT-LISTENER SETUP ---------------------
function setupEventListeners() {
    // Favoriten-Dropdown
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('favorite-select')) {
            const monitorIndex = e.target.getAttribute('data-monitor');
            updateUrlFromFavorite(e.target, parseInt(monitorIndex));
        }
    });

    // Buttons (edit/save/delete in Favoriten-Modal)
    document.addEventListener('click', (e) => {
        // Favoriten bearbeiten
        if (e.target.classList.contains('edit-btn')) {
            const item = e.target.closest('.favorite-item');
            if (item) {
                item.querySelector('.fav-edit-name').readOnly = false;
                item.querySelector('.fav-edit-url').readOnly = false;
                item.querySelector('.save-btn').style.display = '';
                e.target.style.display = 'none';
            }
        }
        // Favoriten speichern
        if (e.target.classList.contains('save-btn')) {
            const index = parseInt(e.target.dataset.index);
            const item = e.target.closest('.favorite-item');
            if (item && !isNaN(index)) {
                const name = item.querySelector('.fav-edit-name').value.trim();
                const url = item.querySelector('.fav-edit-url').value.trim();
                if (!name || !url) {
                    alert('Bitte füllen Sie beide Felder aus.');
                    return;
                }
                if (!/^https?:\/\//i.test(url)) {
                    alert('Bitte geben Sie eine gültige URL ein (mit http:// oder https://).');
                    return;
                }
                favorites[index] = { name, url };
                window.electronAPI.saveFavorites(favorites).then(loadFavoritesInModal);
            }
        }
        // Favorit löschen
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index);
            deleteFavoriteItem(index);
        }

        // Vorschau-Button
        if (e.target.classList.contains('toggle-preview')) {
            const monitorIndex = e.target.getAttribute('data-monitor');
            openPreviewWindow(parseInt(monitorIndex));
        }

        // Favoriten Modal schließen - X Button
        if (e.target.id === 'close-favorites') {
            e.preventDefault();
            e.stopPropagation();
            closeFavoritesModal();
            return false;
        }

        // Favorit hinzufügen
        if (e.target.id === 'add-favorite-btn') {
            e.preventDefault();
            addFavorite();
        }
    });

    // Modal schließen bei Klick außerhalb des Contents
    document.addEventListener('click', (e) => {
        const favoritesModal = document.getElementById('favorites-modal');
        if (e.target === favoritesModal) {
            closeFavoritesModal();
        }
    });

    // ESC-Taste für Modal schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const favoritesModal = document.getElementById('favorites-modal');
            if (favoritesModal && favoritesModal.classList.contains('visible')) {
                closeFavoritesModal();
            }
        }
    });
}

// ------------------- FAVORITEN URL UPDATE FUNKTION ---------------------
function updateUrlFromFavorite(selectElement, monitorIndex) {
    const selectedUrl = selectElement.value;
    const urlInput = document.querySelector(`input[data-monitor="${monitorIndex}"]`);
    
    if (!urlInput) {
        console.error(`URL-Input für Monitor ${monitorIndex} nicht gefunden`);
        return;
    }
    
    // URL-Feld aktualisieren
    if (selectedUrl && selectedUrl.trim() !== '') {
        urlInput.value = selectedUrl;
        console.log(`Monitor ${monitorIndex}: URL gesetzt auf ${selectedUrl}`);
        
        // Optional: Display-Counter aktualisieren
        updateDisplayCounts();
    } else {
        // Falls "— Favorit wählen —" ausgewählt wird, URL-Feld leeren
        urlInput.value = '';
        console.log(`Monitor ${monitorIndex}: URL-Feld geleert`);
        
        // Display-Counter aktualisieren
        updateDisplayCounts();
    }
}

// === FAVORITEN-MODAL FUNKTIONEN ===
function editFavorites() {
    loadFavoritesInModal();
    const modal = document.getElementById('favorites-modal');
    if (modal) {
        modal.classList.add('visible');
    }
}

function closeFavoritesModal() {
    const modal = document.getElementById('favorites-modal');
    if (modal) {
        modal.classList.remove('visible');
        console.log('Modal geschlossen');
    }
}

function openGoogleSlidesFull(url) {
    window.electronAPI.send('open-google-fullscreen', url);
}

async function loadFavoritesInModal() {
    try {
        favorites = await window.electronAPI.getFavorites();
        if (!Array.isArray(favorites)) favorites = [];
        const favoritesList = document.getElementById('favorites-list');
        if (!favoritesList) return;

        favoritesList.innerHTML = '';

        if (favorites.length === 0) {
            favoritesList.innerHTML = '<div class="favorites-empty">Noch keine Favoriten vorhanden.<br>Fügen Sie oben einen Favoriten hinzu.</div>';
            return;
        }

        favorites.forEach((favorite, index) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.innerHTML = `
                <input type="text" class="fav-edit-name url-input" value="${favorite.name}" readonly />
                <input type="url" class="fav-edit-url url-input" value="${favorite.url}" readonly />
                <button class="btn green edit-btn" type="button" data-index="${index}">Bearbeiten</button>
                <button class="btn green save-btn" type="button" data-index="${index}" style="display:none;">Speichern</button>
                <button class="btn red delete-btn" type="button" data-index="${index}">Löschen</button>
            `;
            favoritesList.appendChild(item);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Favoriten:', error);
    }
}

async function addFavorite() {
    const nameInput = document.getElementById('new-favorite-name');
    const urlInput = document.getElementById('new-favorite-url');

    if (!nameInput || !urlInput) return;

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!name || !url) {
        alert('Bitte füllen Sie beide Felder aus.');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Bitte geben Sie eine gültige URL ein (mit http:// oder https://).');
        return;
    }

    try {
        const newFavorite = { name, url };
        favorites.push(newFavorite);

try {
  await window.electronAPI.saveFavorites(favorites);
  showStatus('Favoriten erfolgreich gespeichert', 'info');
} catch (error) {
  console.error('Fehler beim Speichern der Favoriten:', error);
  showStatus('Fehler beim Speichern der Favoriten', 'error');
}
        nameInput.value = '';
        urlInput.value = '';

        await loadFavoritesInModal();
        updateFavoriteDropdowns();

    } catch (error) {
        console.error('Fehler beim Hinzufügen des Favorits:', error);
        alert('Fehler beim Speichern des Favorits.');
    }
}

// Die folgenden "editFavoriteItem" und "updateFavoriteDropdowns" sind für Dropdown-Updates im Konfig, können bleiben!
async function editFavoriteItem(index) {
    if (index < 0 || index >= favorites.length) return;

    const favorite = favorites[index];
    const newName = prompt('Name bearbeiten:', favorite.name);

    if (newName === null) return;

    const newUrl = prompt('URL bearbeiten:', favorite.url);

    if (newUrl === null) return;

    if (newName.trim() && newUrl.trim()) {
        try {
            favorites[index] = { name: newName.trim(), url: newUrl.trim() };
            await window.electronAPI.saveFavorites(favorites);
            await loadFavoritesInModal();
            updateFavoriteDropdowns();
        } catch (error) {
            console.error('Fehler beim Bearbeiten des Favorits:', error);
            alert('Fehler beim Speichern der Änderungen.');
        }
    }
}

async function deleteFavoriteItem(index) {
    if (index < 0 || index >= favorites.length) return;

    const favorite = favorites[index];
    if (confirm(`Favorit "${favorite.name}" wirklich löschen?`)) {
        try {
            favorites.splice(index, 1);
            await window.electronAPI.saveFavorites(favorites);
            await loadFavoritesInModal();
            updateFavoriteDropdowns();
        } catch (error) {
            console.error('Fehler beim Löschen des Favorits:', error);
            alert('Fehler beim Löschen des Favorits.');
        }
    }
}

function updateFavoriteDropdowns() {
    const selects = document.querySelectorAll('.favorite-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = `
            <option value="">— Favorit wählen —</option>
            ${favorites.map(f => `<option value="${f.url}">${f.name}</option>`).join('')}
        `;
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

async function showAllowlistBadge() {
  const el = document.getElementById('allowlist-badge');
  if (!el || !window.electronAPI?.getAllowlistStatus) return;
  try {
    const st = await window.electronAPI.getAllowlistStatus();
    el.hidden = false;
    if (st?.enforce) {
      el.textContent = 'Allowlist aktiv (ENFORCE)';
      el.classList.remove('gray');
      el.classList.add('green');
    } else {
      el.textContent = 'Allowlist Monitor-Only';
      el.classList.remove('green');
      el.classList.add('gray');
    }
  } catch {}
}


// ------------------- BESTEHENDE FUNKTIONEN ---------------------
function startApp() {
    const configs = [];
    displays.forEach((display, index) => {
        const urlInput = document.querySelector(`input[data-monitor="${index}"]`);
        if (urlInput && urlInput.value.trim()) {
            configs.push({
                monitorIndex: index,
                url: urlInput.value.trim()
            });
        }
    });

    if (configs.length > 0) {
        window.electronAPI.startApp(configs);
    } else {
        alert('Bitte konfigurieren Sie mindestens ein TV-Gerät.');
    }
}

function deleteConfig() {
    window.electronAPI.deleteConfig();
}

function disableAutostart() {
    window.electronAPI.disableAutostart();
    alert("Autostart wurde deaktiviert.");
}

window.electronAPI.onMissingDisplays((event, missingDisplays) => {
    if (missingDisplays.length > 0) {
        const message = `Warnung: ${missingDisplays.length} TV-Gerät(e) nicht mehr verfügbar:\n${missingDisplays.join('\n')}`;
        alert(message);
    }
});


function openPreviewWindow(monitorIndex) {
    const urlInput = document.querySelector(`input[data-monitor="${monitorIndex}"]`);
    if (urlInput && urlInput.value.trim()) {
        // Öffne die URL im neuen Tab/Fenster als Vorschau
        window.open(urlInput.value.trim(), '_blank');
    } else {
        alert('Bitte zuerst eine gültige URL eingeben!');
    }
}

function updateDisplayCounts() {
    // Zählt alle Monitore (TVs), zeigt aktuelle Zahl konfigurierter Geräte an
    const displayCountElem = document.getElementById('display-count');
    if (displayCountElem && Array.isArray(displays)) {
        displayCountElem.textContent = displays.length + ' TV-Geräte erkannt';
    }

    // Aktuell konfigurierte Monitore (Anzahl gesetzter URLs)
    const tvCounter = document.getElementById('tv-counter');
    if (tvCounter && Array.isArray(displays)) {
        let count = 0;
        for (let i = 0; i < displays.length; i++) {
            const urlInput = document.querySelector(`input[data-monitor="${i}"]`);
            if (urlInput && urlInput.value.trim()) count++;
        }
        tvCounter.textContent = count + ' TV-Geräte konfiguriert';
    }
}

// Am Ende deiner Datei:
window.quitApp = function() {
    window.electronAPI.quitApp();
};
if (window.monitor) {
  window.monitor.onChange(({ displays, primaryId }) => {
    console.log('[Hotplug] displays changed', { displays, primaryId });
    toast(`Displays: ${displays.length} • Primary: ${primaryId}`);
    // TODO: hier Toast/Overlay/Reload falls gewünscht
  });
  window.monitor.getStatus().then(s => console.log('[Hotplug] initial', s));
}

