const STAT_META = {
    rank_global:     { type: 'integer', prefix: '#', diff: 'invert', label: "Global Rank" },
    rank_country:    { type: 'integer', prefix: '#', diff: 'invert', label: "Country Rank" },
    pp:              { type: 'float', decimals: 2, label: "PP" },
    score_total:     { type: 'integer', label: "Total Score" },
    score_ranked:    { type: 'integer', label: "Ranked Score" },
    accuracy:        { type: 'float', decimals: 5, suffix: '%', label: "Accuracy" },
    level:           { type: 'float', decimals: 5, label: "Level" },
    play_count:      { type: 'integer', label: "Play Count" },
    play_time:       { type: 'integer', label: "Play Time" },
    count_hits:      { type: 'integer', label: "Total Hits" },
    count_300:       { type: 'integer', label: "300s" },
    count_100:       { type: 'integer', label: "100s" },
    count_50:        { type: 'integer', label: "50s" },
    count_0:         { type: 'integer', label: "Misses" },
    replays_watched: { type: 'integer', label: "Replays Watched" },
    followers:       { type: 'integer', label: "Followers" },
    rank_ssh:        { type: 'integer', label: "SSH Count" },
    rank_ss:         { type: 'integer', label: "SS Count" },
    rank_sh:         { type: 'integer', label: "SH Count" },
    rank_s:          { type: 'integer', label: "S Count" },
    rank_a:          { type: 'integer', label: "A Count" },
    rank_s_total:    { type: 'integer', label: "Total S" },
    rank_ss_total:   { type: 'integer', label: "Total SS" },
    rank_b:          { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "B Count" },
    rank_c:          { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "C Count" },
    rank_d:          { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "D Count" },
    top_10p_daily:   { type: 'integer', label: "Top 10% Daily" },
    top_50p_daily:   { type: 'integer', label: "Top 50% Daily" },
    weekly_best:     { type: 'integer', label: "Weekly Best" },
    weekly_current:  { type: 'integer', label: "Weekly Current" },
    daily_best:      { type: 'integer', label: "Daily Best" },
    daily_current:   { type: 'integer', label: "Daily Current" },
    total_pp:        { type: 'float', decimals: 2, label: "Total PP" },
    clears:          { type: 'integer', label: "Clears" },
    clears_loved:    { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "Clears Loved" },
    completion:      { type: 'float', decimals: 4, suffix: '%', exclude: ['taiko', 'mania', 'fruits'], label: "Completion" },
    rank_global_ss:  { type: 'integer', prefix: '#', diff: 'invert', exclude: ['taiko', 'mania', 'fruits'], label: "Global SS Rank" },
    rank_country_ss: { type: 'integer', prefix: '#', diff: 'invert', exclude: ['taiko', 'mania', 'fruits'], label: "Country SS Rank" },
    top50s:          { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "Top 50s" },
    score_rank:      { type: 'integer', prefix: '#', diff: 'invert', label: "Score Rank" },
};

window.STAT_META = STAT_META;

const prevStatValues = {};
const prevStatDiffs = {};

let initialStats = null;
let isFetchingStats = false;

function getLocalSetting(key, fallback = {}) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
        return fallback;
    }
}

function getStatMeta(key) {
    return STAT_META[key];
}

function getStatDecimals(key) {
    const meta = getStatMeta(key);
    return meta?.type === 'float' ? meta.decimals : 0;
}

function formatNumber(value, decimals, prefix = '', suffix = '') {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return `${prefix}${value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}${suffix}`;
}

function formatStatValue(value, key) {
    const meta = getStatMeta(key);
    if (!meta) return `${value ?? ''}`;
    const { prefix = '', suffix = '', type, decimals } = meta;

    if (key === 'play_time' && typeof value === 'number' && !isNaN(value)) {
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        const seconds = value % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    if (type === 'string') return `${prefix}${value ?? ''}${suffix}`;
    if (
        ['rank_global', 'rank_country', 'rank_global_ss', 'rank_country_ss', 'score_rank'].includes(key) &&
        value == null
    ) return 'No Rank';

    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!isNaN(numericValue)) {
        if (key === 'accuracy' && numericValue === 100) return `${prefix}100${suffix}`;
        const numDecimals = (type === 'float' && typeof decimals === 'number')
            ? decimals
            : 0;
        return formatNumber(numericValue, numDecimals, prefix, suffix);
    }

    return `${value ?? ''}`;
}

function getAdjustedDiff(diff, key) {
    const meta = getStatMeta(key);
    return meta?.diff === 'invert' ? -diff : diff;
}

function formatDiffValue(diff, key) {
    if (typeof diff !== 'number' || isNaN(diff)) return '';
    const decimals = getStatDecimals(key);
    const adjustedDiff = getAdjustedDiff(diff, key);
    const threshold = decimals > 0 ? Math.pow(10, -decimals) : 1;
    if (Math.abs(adjustedDiff) < threshold) return '';
    const sign = adjustedDiff > 0 ? '+' : '';
    const meta = getStatMeta(key);

    if (key === 'play_time') {
        const abs = Math.abs(adjustedDiff);
        const hours = Math.floor(abs / 3600);
        const minutes = Math.floor((abs % 3600) / 60);
        const seconds = abs % 60;
        let result = [];
        if (hours) result.push(`${hours}h`);
        if (minutes) result.push(`${minutes}m`);
        if (seconds || (!hours && !minutes)) result.push(`${seconds}s`);
        return `${sign}${result.join(' ')}`;
    }

    const suffix = meta?.suffix || '';
    return `${sign}${adjustedDiff.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}${suffix}`;
}

function shouldColorDiffs() {
    const saved = getLocalSetting('statSettings');
    return saved.colorDiffs !== false;
}

function getDiffColorClass(diff, key) {
    if (!shouldColorDiffs()) return '';
    if (typeof diff !== 'number') return '';
    let adjustedDiff = getAdjustedDiff(diff, key);
    if (adjustedDiff > 0) return 'diff-green';
    if (adjustedDiff < 0) return 'diff-red';
    return '';
}

function getEnabledStats() {
    const saved = getLocalSetting('statSettings');
    return Object.entries(saved)
        .filter(([k, v]) => v && k !== 'colorDiffs')
        .map(([k]) => k);
}

function updateStatElement(key, value, diff) {
    const el = document.getElementById(key);
    const diffEl = document.getElementById(`${key}-diff`);
    if (!el) return;

    const formattedValue = formatStatValue(value, key);
    if (prevStatValues[key] !== formattedValue) {
        el.textContent = formattedValue;
        prevStatValues[key] = formattedValue;
    }

    if (diffEl) {
        const formattedDiff = formatDiffValue(diff, key);
        if (prevStatDiffs[key] !== formattedDiff) {
            diffEl.textContent = formattedDiff;
            prevStatDiffs[key] = formattedDiff;
        }
        const diffClass = getDiffColorClass(diff, key);
        if (diffEl.className !== diffClass) {
            diffEl.className = diffClass;
        }
    }
}

function resetInitialStats(stats) {
    initialStats = { ...stats };
}

async function updateAvatarAndUsername(stats) {
    const avatarImg = document.getElementById('avatar-img');
    const usernameSpan = document.getElementById('username');
    if (avatarImg && stats.avatar_url) {
        avatarImg.src = stats.avatar_url;
        avatarImg.style.display = '';
    }
    if (usernameSpan && stats.username) {
        usernameSpan.textContent = stats.username;
    }
    const gamemodeContainer = document.getElementById('gamemode-container');
    if (gamemodeContainer && window.osuAPI?.getUserConfig) {
        const config = await window.osuAPI.getUserConfig();
        const modeDisplayNames = {
            osu: "osu!",
            taiko: "Taiko",
            fruits: "Catch",
            mania: "Mania"
        };
        const displayMode = modeDisplayNames[config.mode] || config.mode || '';
        gamemodeContainer.textContent = displayMode ? `Mode: ${displayMode}` : '';
    }
}

async function displayStats(resetCountdown = true) {
    if (isFetchingStats) return;
    if (!(window.osuAPI && window.osuAPI.fetchStats)) return;
    isFetchingStats = true;

    const stopTimerAnimation = window.timer.startTimerAnimation(window.timer.updateFetchTimerDisplay);

    try {
        const stats = await window.osuAPI.fetchStats();
        if (!stats) return;
        updateAvatarAndUsername(stats);
        
        const config = await window.osuAPI.getUserConfig?.();
        const currentUid = config?.uid;
        const currentMode = config?.mode;
        if (
            !initialStats ||
            initialStats._uid !== currentUid ||
            initialStats._mode !== currentMode
        ) {
            resetInitialStats({ ...stats, _uid: currentUid, _mode: currentMode });
        }

        const enabledStats = getEnabledStats();
        const updates = Object.entries(stats)
            .filter(([key]) => enabledStats.includes(key))
            .map(([key, value]) => {
                let diff;
                if (typeof value === 'number' && typeof initialStats[key] === 'number') {
                    diff = value - initialStats[key];
                }
                return { key, value, diff };
            });

        requestAnimationFrame(() => {
            updates.forEach(({ key, value, diff }) => {
                updateStatElement(key, value, diff);
            });
        });
    } finally {
        stopTimerAnimation();
        isFetchingStats = false;
        if (resetCountdown) {
            window.timer.nextFetchTimestamp = Date.now() + window.timer.fetchInterval * 1000;
            window.timer.updateFetchTimerDisplay(`Next fetch in ${window.timer.fetchInterval}s`);
        }
    }
}

window.displayStats = displayStats;

function setCurrentGamemode(mode) {
    const saved = getLocalSetting('statSettings');
    saved.mode = mode;
    localStorage.setItem('statSettings', JSON.stringify(saved));
    if (window.osuAPI?.saveCredentials) {
        window.osuAPI.saveCredentials({ mode });
    }
    initialStats = null;
    Object.keys(prevStatDiffs).forEach(k => delete prevStatDiffs[k]);
    Object.keys(prevStatValues).forEach(k => delete prevStatValues[k]);
    Object.keys(STAT_META).forEach(key => {
        const diffEl = document.getElementById(`${key}-diff`);
        if (diffEl) diffEl.textContent = '';
    });
}
window.setCurrentGamemode = setCurrentGamemode;

function getCurrentGamemode() {
    const saved = getLocalSetting('statSettings');
    return saved.mode || 'osu';
}
window.getCurrentGamemode = getCurrentGamemode;

function getUsableStatsForGamemode(gamemode) {
    return Object.entries(STAT_META)
        .filter(([key, meta]) => !(meta.exclude && meta.exclude.includes(gamemode)))
        .map(([key]) => key);
}

window.getUsableStatsForGamemode = getUsableStatsForGamemode;

function applyStatVisibility() {
    const enabledStats = getEnabledStats();
    const gamemode = getCurrentGamemode();
    const usableStats = getUsableStatsForGamemode(gamemode);

    Object.keys(STAT_META).forEach(key => {
        const valueEl = document.getElementById(key);
        const diffEl = document.getElementById(`${key}-diff`);
        const valueContainer = valueEl?.closest('.stat-value');
        const diffContainer = diffEl?.closest('.stat-diff');
        const labelEl = valueContainer?.previousElementSibling;

        const visible = enabledStats.includes(key) && usableStats.includes(key);

        if (labelEl?.classList.contains('stat-label')) {
            labelEl.style.display = visible ? '' : 'none';
        }
        if (valueContainer) valueContainer.style.display = visible ? '' : 'none';
        if (diffContainer) diffContainer.style.display = visible ? '' : 'none';
    });
}
window.applyStatVisibility = applyStatVisibility;

function rerenderStatDiffs() {
    if (!initialStats) return;
    const enabledStats = getEnabledStats();
    Object.keys(prevStatValues).forEach(key => {
        if (!enabledStats.includes(key)) return;
        const el = document.getElementById(key);
        const diffEl = document.getElementById(`${key}-diff`);
        if (!el || !diffEl) return;
        const currentValue = el.textContent;
        let statValue = currentValue;
        if (STAT_META[key]?.type === 'float' || STAT_META[key]?.type === 'integer') {
            statValue = Number(currentValue.replace(/[^\d.-]/g, ''));
        }
        let diff;
        if (typeof statValue === 'number' && typeof initialStats[key] === 'number') {
            diff = statValue - initialStats[key];
        }
        const diffClass = getDiffColorClass(diff, key);
        diffEl.className = diffClass;
    });
}
window.rerenderStatDiffs = rerenderStatDiffs;

function updateStatCheckboxesForGamemode(gamemode) {
    document.querySelectorAll('#stat-settings input[type="checkbox"][value]').forEach(cb => {
        const label = cb.parentElement;
        const meta = STAT_META?.[cb.value];
        if (meta?.exclude && meta.exclude.includes(gamemode)) {
            label.classList.add('stat-disabled');
            cb.disabled = true;
        } else {
            label.classList.remove('stat-disabled');
            cb.disabled = false;
        }
    });
}

function getStatLabel(key) {
    return STAT_META[key]?.label || key;
}

function generateStatsGrid() {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;
    statsGrid.innerHTML = '';

    Object.keys(STAT_META).forEach(key => {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'stat-label';
        labelDiv.textContent = getStatLabel(key) + ":";

        const valueDiv = document.createElement('div');
        valueDiv.className = 'stat-value';
        const valueSpan = document.createElement('span');
        valueSpan.id = key;
        valueDiv.appendChild(valueSpan);

        const diffDiv = document.createElement('div');
        diffDiv.className = 'stat-diff';
        const diffSpan = document.createElement('span');
        diffSpan.id = `${key}-diff`;
        diffDiv.appendChild(diffSpan);

        statsGrid.appendChild(labelDiv);
        statsGrid.appendChild(valueDiv);
        statsGrid.appendChild(diffDiv);
    });
}

function migrateStatSettings() {
    const saved = getLocalSetting('statSettings');
    let changed = false;

    Object.keys(STAT_META).forEach(key => {
        if (!(key in saved)) {
            saved[key] = false;
            changed = true;
        }
    });

    Object.keys(saved).forEach(key => {
        if (!(key in STAT_META) && key !== 'colorDiffs' && key !== 'showTimer' && key !== 'mode') {
            delete saved[key];
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem('statSettings', JSON.stringify(saved));
    }
    return saved;
}

window.migrateStatSettings = migrateStatSettings;

function generateStatSettingsCheckboxes() {
    const container = document.getElementById('stat-settings');
    if (!container) return;
    container.innerHTML = '';

    Object.entries(STAT_META).forEach(([key, meta]) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = key;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + (meta.label || key)));
        container.appendChild(label);
        checkbox.addEventListener('change', () => {
            if (typeof window.saveStatSettings === 'function') {
                window.saveStatSettings();
            }
            if (typeof window.applyStatVisibility === 'function') {
                window.applyStatVisibility();
            }
            if (window.rerenderStatDiffs) window.rerenderStatDiffs();
        });
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    migrateStatSettings();
    generateStatSettingsCheckboxes();
    let gamemode = 'osu';
    if (window.osuAPI?.getUserConfig) {
        const config = await window.osuAPI.getUserConfig();
        gamemode = config.mode || 'osu';
        const saved = JSON.parse(localStorage.getItem('statSettings') || '{}');
        if (saved.mode !== gamemode) {
            saved.mode = gamemode;
            localStorage.setItem('statSettings', JSON.stringify(saved));
        }
    }
    generateStatsGrid();
    applyStatVisibility();
    if (typeof window.updateStatCheckboxesForGamemode === 'function') {
        window.updateStatCheckboxesForGamemode(gamemode);
    }
    await displayStats(true);
    window.timer.startPolling(displayStats);
}, { once: true });

window.updateFetchTimerDisplay = window.timer.updateFetchTimerDisplay;