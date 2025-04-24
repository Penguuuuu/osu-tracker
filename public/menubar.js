const MODAL_IDS = [
    'settings-modal', 
    'login-modal', 
    'help-modal'
];

function getById(id) {
    return document.getElementById(id);
}

function setModalDisplay(modalId, show) {
    MODAL_IDS.forEach(id => {
        const modal = getById(id);
        if (modal) modal.style.display = (id === modalId && show) ? 'block' : 'none';
    });
    const statsDiv = getById('stats');
    const anyModalVisible = MODAL_IDS.some(id => getById(id)?.style.display === 'block');
    if (statsDiv) statsDiv.style.display = anyModalVisible ? 'none' : '';
}

async function loadStatSettings() {
    let saved = {};
    if (window.osuAPI?.getStatSettings) {
        saved = await window.osuAPI.getStatSettings() || {};
    } else {
        saved = JSON.parse(localStorage.getItem('statSettings') || '{}');
    }

    document.querySelectorAll('#stat-settings input[type="checkbox"][value]').forEach(cb => {
        cb.checked = saved[cb.value] === true;
    });
    document.getElementById('color-diffs-toggle').checked = saved.colorDiffs !== false;
    document.getElementById('show-timer-toggle').checked = saved.showTimer !== false;

    let gamemode = 'osu';
    if (window.osuAPI?.getUserConfig) {
        const config = await window.osuAPI.getUserConfig();
        gamemode = config.mode || 'osu';

        const dropdown = document.getElementById('settings-gamemode-dropdown');
        if (dropdown) {
            const selected = dropdown.querySelector('.selected');
            const optionDivs = dropdown.querySelectorAll('.option');
            const match = Array.from(optionDivs).find(opt => opt.dataset.value === gamemode);
            if (match && selected) {
                selected.textContent = match.textContent;
                dropdown.dataset.value = gamemode;
            }
            if (typeof window.updateStatCheckboxesForGamemode === 'function') {
                window.updateStatCheckboxesForGamemode(gamemode);
            }
        }
    }
}

function saveStatSettings() {
    const settings = {};
    document.querySelectorAll('#stat-settings input[type="checkbox"][value]').forEach(cb => {
        settings[cb.value] = cb.checked;
    });
    settings.colorDiffs = document.getElementById('color-diffs-toggle').checked;
    settings.showTimer = document.getElementById('show-timer-toggle').checked;

    if (window.osuAPI?.saveStatSettings) {
        window.osuAPI.saveStatSettings(settings);
    }
    localStorage.setItem('statSettings', JSON.stringify(settings));
}

function setActiveMenu(btnId) {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === btnId);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    getById('home-btn')?.addEventListener('click', () => {
        setModalDisplay('', false);
        setActiveMenu('home-btn');
    });

    [
        { btn: 'settings-btn', modal: 'settings-modal', before: loadStatSettings },
        { btn: 'login-btn', modal: 'login-modal', before: async () => {
            if (window.osuAPI?.getUserConfig) {
                const config = await window.osuAPI.getUserConfig();
                getById('login-uid').value = config.uid || '';
                getById('login-clientid').value = config.client_id || '';
                getById('login-clientsecret').value = config.client_secret || '';
            }
        }},
        { btn: 'help-btn', modal: 'help-modal' }
    ].forEach(({ btn, modal, before }) => {
        getById(btn)?.addEventListener('click', async () => {
            if (before) await before();
            setModalDisplay(modal, true);
            setActiveMenu(btn);
        });
    });

    getById('login-save-btn')?.addEventListener('click', async () => {
        const uid = getById('login-uid')?.value;
        const clientId = getById('login-clientid')?.value;
        const clientSecret = getById('login-clientsecret')?.value;
        let mode = 'osu';
        const dropdown = document.getElementById('settings-gamemode-dropdown');
        if (dropdown && dropdown.dataset.value) {
            mode = dropdown.dataset.value;
        }
        if (window.osuAPI?.saveCredentials) {
            window.osuAPI.saveCredentials({ 
                uid, 
                client_id: clientId, 
                client_secret: clientSecret, 
                mode
            });
        }
    });

    getById('settings-save-btn')?.addEventListener('click', () => {
        const dropdown = document.getElementById('settings-gamemode-dropdown');
        const gamemode = dropdown?.dataset.value || 'osu';
        window.setCurrentGamemode(gamemode);
        if (typeof window.updateStatCheckboxesForGamemode === 'function') {
            window.updateStatCheckboxesForGamemode(gamemode);
        }
        if (typeof window.applyStatVisibility === 'function') {
            window.applyStatVisibility();
        }
        saveStatSettings();
        if (window.rerenderStatDiffs) window.rerenderStatDiffs();
    });

    document.getElementById('settings-gamemode')?.addEventListener('change', (e) => {
        updateStatCheckboxesForGamemode(e.target.value);
    });

    const gamemodeDropdown = document.getElementById('settings-gamemode-dropdown');
    gamemodeDropdown?.addEventListener('gamemodechange', (e) => {
        const gamemode = e.detail;
        if (typeof window.setCurrentGamemode === 'function') {
            window.setCurrentGamemode(gamemode);
        }
        if (typeof window.updateStatCheckboxesForGamemode === 'function') {
            window.updateStatCheckboxesForGamemode(gamemode);
        }
        if (typeof window.applyStatVisibility === 'function') {
            window.applyStatVisibility();
        }
        if (typeof window.saveStatSettings === 'function') {
            window.saveStatSettings();
        }
        if (window.rerenderStatDiffs) window.rerenderStatDiffs();
    });

    document.getElementById('color-diffs-toggle')?.addEventListener('change', () => {
        if (typeof window.saveStatSettings === 'function') {
            window.saveStatSettings();
        }
        if (window.rerenderStatDiffs) window.rerenderStatDiffs();
    });
    document.getElementById('show-timer-toggle')?.addEventListener('change', () => {
        if (typeof window.saveStatSettings === 'function') {
            window.saveStatSettings();
        }

        if (window.timer?.updateFetchTimerDisplay) {
            window.timer.updateFetchTimerDisplay();
        }
    });

    setActiveMenu('home-btn');
});