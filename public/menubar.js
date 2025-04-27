function makeHandler(updateFn) {
    return () => {
        if (typeof window.saveStatSettings === 'function') window.saveStatSettings();
        if (typeof updateFn === 'function') updateFn();
    };
}

const DISPLAY_OPTIONS = [
    {
        id: 'color-diffs-toggle',
        label: 'Colored stat differences',
        default: true,
        handler: makeHandler(() => window.rerenderStatDiffs?.())
    },
    {
        id: 'show-timer-toggle',
        label: 'Show fetch timer',
        default: true,
        handler: makeHandler(() => window.timer?.updateFetchTimerDisplay?.())
    },
    {
        id: 'show-daily-timer-toggle',
        label: 'Show daily timer',
        default: false,
        handler: makeHandler(() => window.updateDailyTimerDisplay?.())
    },
    {
        id: 'show-weekly-timer-toggle',
        label: 'Show weekly timer',
        default: false,
        handler: makeHandler(() => window.updateWeeklyTimerDisplay?.())
    }
];

const MODAL_IDS = [
    'settings-modal', 
    'login-modal', 
    'help-modal'
];

function getById(id) {
    return document.getElementById(id);
}

function setModalDisplay(modalId, show) {
    let anyModalVisible = false;
    MODAL_IDS.forEach(id => {
        const modal = getById(id);
        if (!modal) return;
        const shouldShow = (id === modalId && show);
        if (shouldShow) anyModalVisible = true;
        if (modal.style.display !== (shouldShow ? 'block' : 'none')) {
            modal.style.display = shouldShow ? 'block' : 'none';
        }
    });
    const statsDiv = getById('stats');
    if (statsDiv) {
        const shouldHideStats = anyModalVisible;
        if (statsDiv.style.display !== (shouldHideStats ? 'none' : '')) {
            statsDiv.style.display = shouldHideStats ? 'none' : '';
        }
    }
}

function applyGamemodeSettings(gamemode) {
    window.setCurrentGamemode?.(gamemode);
    window.updateStatCheckboxesForGamemode?.(gamemode);
    window.applyStatVisibility?.();
    window.saveStatSettings?.();
    window.rerenderStatDiffs?.();
}

function getStatSettingsFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('statSettings') || '{}');
    } catch {
        return {};
    }
}
function setStatSettingsToStorage(settings) {
    localStorage.setItem('statSettings', JSON.stringify(settings));
}

function getDisplayOptionKey(id) {
    return id
        .replace('-toggle', '')
        .split('-')
        .map((s, i) => i === 0 ? s : s[0].toUpperCase() + s.slice(1))
        .join('');
}

function updateStatCheckboxesForGamemode(gamemode) {
    const saved = getStatSettingsFromStorage();
    let changed = false;
    const checkboxes = document.querySelectorAll('#stat-settings input[type="checkbox"][value]');
    checkboxes.forEach(cb => {
        const label = cb.parentElement;
        const meta = window.STAT_META?.[cb.value];
        const shouldDisable = meta?.exclude && meta.exclude.includes(gamemode);

        if (shouldDisable) {
            if (!label.classList.contains('stat-disabled')) label.classList.add('stat-disabled');
            if (!cb.disabled) cb.disabled = true;
            if (cb.checked) {
                cb.checked = false;
                saved[cb.value] = false;
                changed = true;
            }
        } else {
            if (label.classList.contains('stat-disabled')) label.classList.remove('stat-disabled');
            if (cb.disabled) cb.disabled = false;
        }
    });
    if (changed) {
        setStatSettingsToStorage(saved);
    }
}
window.updateStatCheckboxesForGamemode = updateStatCheckboxesForGamemode;

async function loadStatSettings() {
    let saved = {};
    try {
        if (window.osuAPI?.getStatSettings) {
            saved = await window.osuAPI.getStatSettings() || {};
        } else {
            saved = getStatSettingsFromStorage();
        }
    } catch (e) {}

    document.querySelectorAll('#stat-settings input[type="checkbox"][value]').forEach(cb => {
        cb.checked = saved[cb.value] === true;
    });

    DISPLAY_OPTIONS.forEach(opt => {
        const el = document.getElementById(opt.id);
        if (!el) return;
        const key = getDisplayOptionKey(opt.id);
        el.checked = saved[key] !== false;
    });

    let gamemode = 'osu';
    try {
        if (window.osuAPI?.getUserConfig) {
            const config = await window.osuAPI.getUserConfig();
            gamemode = config.mode || 'osu';
        }
    } catch (e) {}

    const dropdown = document.getElementById('settings-gamemode-dropdown');
    if (dropdown) {
        const selected = dropdown.querySelector('.selected');
        const optionDivs = dropdown.querySelectorAll('.option');
        const match = Array.from(optionDivs).find(opt => opt.dataset.value === gamemode);
        if (match && selected && selected.textContent !== match.textContent) {
            selected.textContent = match.textContent;
            dropdown.dataset.value = gamemode;
        }
    }
    window.updateStatCheckboxesForGamemode?.(gamemode);
}

function saveStatSettings() {
    const settings = {};
    document.querySelectorAll('#stat-settings input[type="checkbox"][value]').forEach(cb => {
        settings[cb.value] = cb.checked;
    });

    DISPLAY_OPTIONS.forEach(opt => {
        const el = document.getElementById(opt.id);
        if (el) {
            const key = getDisplayOptionKey(opt.id);
            settings[key] = el.checked;
        }
    });

    window.osuAPI?.saveStatSettings?.(settings);
    setStatSettingsToStorage(settings);
}

window.saveStatSettings = saveStatSettings;
window.loadStatSettings = loadStatSettings;

function setActiveMenu(btnId) {
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === btnId);
    });
}

function onDisplayOptionChange(e) {
    const opt = DISPLAY_OPTIONS.find(o => o.id === e.target.id);
    opt?.handler?.();
}

function setupDisplayOptions() {
    const customizationSettings = document.getElementById('customization-settings');
    if (!customizationSettings) return;
    const p = customizationSettings.querySelector('p');
    if (!p) return;
    p.innerHTML = '';

    const saved = getStatSettingsFromStorage();
    const fragment = document.createDocumentFragment();

    DISPLAY_OPTIONS.forEach(opt => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = opt.id;
        const key = getDisplayOptionKey(opt.id);
        checkbox.checked = saved[key] !== undefined ? saved[key] !== false : opt.default;
        checkbox.addEventListener('change', onDisplayOptionChange);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + opt.label));
        fragment.appendChild(label);
    });

    p.appendChild(fragment);
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
        const dropdown = getById('settings-gamemode-dropdown');
        const gamemode = dropdown?.dataset.value || 'osu';
        applyGamemodeSettings(gamemode);
    });

    const gamemodeDropdown = getById('settings-gamemode-dropdown');
    gamemodeDropdown?.addEventListener('gamemodechange', (e) => {
        const gamemode = e.detail;
        applyGamemodeSettings(gamemode);
    });

    setupDisplayOptions();
    setActiveMenu('home-btn');
});