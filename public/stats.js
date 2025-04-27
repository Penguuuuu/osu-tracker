const STAT_META = {
    pp:                 { type: 'float', decimals: 2, label: "PP" },
    total_pp:           { type: 'float', decimals: 2, label: "Total PP", exclude: ['taiko', 'mania', 'fruits'] },
    rank_global:        { type: 'integer', prefix: '#', invertDiff: true, label: "Global Rank" },
    rank_country:       { type: 'integer', prefix: '#', invertDiff: true, label: "Country Rank" },
    rank_global_ss:     { type: 'integer', prefix: '#', invertDiff: true, exclude: ['taiko', 'mania', 'fruits'], label: "Global SS Rank" },
    rank_country_ss:    { type: 'integer', prefix: '#', invertDiff: true, exclude: ['taiko', 'mania', 'fruits'], label: "Country SS Rank" },
    score_total:        { type: 'integer', label: "Total Score" },
    score_ranked:       { type: 'integer', label: "Ranked Score" },
    score_to_next_rank: { type: 'integer', label: "Score to Next Rank", invertCol: true },
    score_to_prev_rank: { type: 'integer', label: "Score to Prev Rank", invertdiff: true },
    score_rank:         { type: 'integer', prefix: '#', invertDiff: true, label: "Score Rank" },
    avg_ranked_score:   { type: 'integer', label: "Avg Ranked Score" },
    avg_total_score:    { type: 'integer', label: "Avg Total Score" },
    top50s:             { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "Top 50s" },
    accuracy:           { type: 'float', decimals: 5, suffix: '%', label: "Accuracy" },
    level:              { type: 'float', decimals: 5, label: "Level" },
    replays_watched:    { type: 'integer', label: "Replays Watched" },
    followers:          { type: 'integer', label: "Followers" },
    play_count:         { type: 'integer', label: "Play Count" },
    play_time:          { type: 'integer', label: "Play Time"},
    completion:         { type: 'float', decimals: 4, suffix: '%', exclude: ['taiko', 'mania', 'fruits'], label: "Completion" },
    clears:             { type: 'integer', label: "Clears" },
    clears_loved:       { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "Clears Loved" },
    rank_ss_total:      { type: 'integer', label: "Total SS" },
    rank_s_total:       { type: 'integer', label: "Total S" },
    rank_ssh:           { type: 'integer', label: "SSH Count" },
    rank_ss:            { type: 'integer', label: "SS Count" },
    rank_sh:            { type: 'integer', label: "SH Count" },
    rank_s:             { type: 'integer', label: "S Count" },
    rank_a:             { type: 'integer', label: "A Count" },
    rank_b:             { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "B Count" },
    rank_c:             { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "C Count" },
    rank_d:             { type: 'integer', exclude: ['taiko', 'mania', 'fruits'], label: "D Count" },
    top_10p_daily:      { type: 'integer', label: "Top 10% Daily" },
    top_50p_daily:      { type: 'integer', label: "Top 50% Daily" },
    weekly_best:        { type: 'integer', label: "Weekly Best" },
    weekly_current:     { type: 'integer', label: "Weekly Current" },
    daily_best:         { type: 'integer', label: "Daily Best" },
    daily_current:      { type: 'integer', label: "Daily Current" },
    count_hits:         { type: 'integer', label: "Total Hits" },
    count_300:          { type: 'integer', label: "300s" },
    count_100:          { type: 'integer', label: "100s" },
    count_50:           { type: 'integer', label: "50s" },
    count_0:            { type: 'integer', label: "Misses" },
    ranked_loved_count: { type: 'integer', label: "Ranked/Loved maps", exclude: ['taiko', 'mania', 'fruits'] },
};
window.STAT_META = STAT_META;

const prevStatValues = {};
const prevStatDiffs = {};
let initialStats = null;
let isFetchingStats = false;
let firstFetchAfterReset = true;
let prevScoreRank = null;

function getLocalSetting(key, fallback = {}) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
        return fallback;
    }
}

function formatPlayTime(seconds, { compact = false } = {}) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (!compact) return `${hours}h ${minutes}m ${secs}s`;
    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (minutes || hours) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(' ');
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
    if (!meta) return value == null ? '' : `${value}`;
    const { prefix = '', suffix = '', type, decimals } = meta;
    if (key === 'play_time' && typeof value === 'number' && !isNaN(value)) {
        return formatPlayTime(value);
    }
    if (type === 'string') return `${prefix}${value ?? ''}${suffix}`;
    if (meta.prefix === '#' && (value == null || value === 0)) return 'No Rank';
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!isNaN(numericValue)) {
        if (key === 'accuracy' && numericValue === 100) return `${prefix}100${suffix}`;
        const numDecimals = (type === 'float' && typeof decimals === 'number') ? decimals : 0;
        if (type === 'float' && numDecimals > 0 && numericValue === 0) {
            return `${prefix}0${suffix}`;
        }
        return formatNumber(numericValue, numDecimals, prefix, suffix);
    }
    return value == null ? '' : `${value}`;
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
        return `${sign}${formatPlayTime(abs, { compact: true })}`;
    }
    const suffix = meta?.suffix || '';
    return `${sign}${adjustedDiff.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })}${suffix}`;
}

function getStatMeta(key) {
    return STAT_META[key];
}

function getStatDecimals(key) {
    const meta = getStatMeta(key);
    return meta?.type === 'float' ? meta.decimals : 0;
}

function getAdjustedDiff(diff, key) {
    const meta = getStatMeta(key);
    if (meta?.invertDiff) return -diff;
    return diff;
}

function getDiffColorClass(diff, key) {
    if (!shouldColorDiffs()) return '';
    if (typeof diff !== 'number') return '';
    const meta = getStatMeta(key);
    let adjustedDiff = getAdjustedDiff(diff, key);
    let positiveClass = 'diff-green';
    let negativeClass = 'diff-red';
    if (meta?.invertCol) {
        positiveClass = 'diff-red';
        negativeClass = 'diff-green';
    }
    if (adjustedDiff > 0) return positiveClass;
    if (adjustedDiff < 0) return negativeClass;
    return '';
}

function shouldColorDiffs() {
    const saved = getLocalSetting('statSettings');
    return saved.colorDiffs !== false;
}

function getEnabledStats() {
    const saved = getLocalSetting('statSettings');
    return Object.entries(saved)
        .filter(([k, v]) => v && k !== 'colorDiffs')
        .map(([k]) => k);
}

function getCurrentGamemode() {
    const saved = getLocalSetting('statSettings');
    return saved.mode || 'osu';
}

function getUsableStatsForGamemode(gamemode) {
    return Object.entries(STAT_META)
        .filter(([key, meta]) => !(meta.exclude && meta.exclude.includes(gamemode)))
        .map(([key]) => key);
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
            if (typeof window.saveStatSettings === 'function') window.saveStatSettings();
            if (typeof window.applyStatVisibility === 'function') window.applyStatVisibility();
            if (window.rerenderStatDiffs) window.rerenderStatDiffs();
        });
    });
}

function setupScoreRankHover() {
    ['score_to_prev_rank', 'score_to_next_rank'].forEach(key => {
        const valueEl = document.getElementById(key);
        if (!valueEl) return;
        const container = valueEl.closest('.stat-value');
        if (!container) return;
        function getHoverName() {
            if (key === 'score_to_prev_rank') return prevStatValues['score_rank_prev'] || '';
            if (key === 'score_to_next_rank') return prevStatValues['score_rank_next'] || '';
            return '';
        }
        function showName() {
            const hoverName = getHoverName();
            if (hoverName && hoverName.trim() !== '') {
                valueEl.dataset.prevValue = valueEl.textContent;
                valueEl.textContent = hoverName;
            }
        }
        function restoreValue() {
            if ('prevValue' in valueEl.dataset) {
                valueEl.textContent = valueEl.dataset.prevValue;
                delete valueEl.dataset.prevValue;
            }
        }
        container.addEventListener('mouseenter', showName);
        container.addEventListener('mouseleave', restoreValue);
        container.addEventListener('focus', showName, true);
        container.addEventListener('blur', restoreValue, true);
    });
}

function resetInitialStats(stats) {
    initialStats = { ...stats };
    firstFetchAfterReset = true;
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
            prevScoreRank = stats.score_rank;
        }
        const enabledStats = getEnabledStats();
        let scoreRankChanged = false;
        if (typeof prevScoreRank === 'number' && stats.score_rank !== prevScoreRank) {
            scoreRankChanged = true;
        }
        const updates = Object.entries(stats)
            .filter(([key]) => enabledStats.includes(key))
            .map(([key, value]) => {
                let diff;
                if (!firstFetchAfterReset && typeof value === 'number' && typeof initialStats[key] === 'number') {
                    if (
                        (key === 'score_to_next_rank' || key === 'score_to_prev_rank') &&
                        scoreRankChanged
                    ) {
                        diff = '';
                        initialStats.score_to_next_rank = value;
                    } else {
                        diff = value - initialStats[key];
                    }
                }
                return { key, value, diff };
            });
        requestAnimationFrame(() => {
            updates.forEach(({ key, value, diff }) => {
                updateStatElement(key, value, diff);
            });
        });
        if (scoreRankChanged) {
            prevScoreRank = stats.score_rank;
        }
        updatePrevScoreRankValues(stats);
    } finally {
        stopTimerAnimation();
        isFetchingStats = false;
        if (resetCountdown) {
            window.timer.nextFetchTimestamp = Date.now() + window.timer.fetchInterval * 1000;
            window.timer.updateFetchTimerDisplay(`Next fetch in ${window.timer.fetchInterval}s`);
        }
        firstFetchAfterReset = false;
    }
}

function updatePrevScoreRankValues(stats) {
    prevStatValues['score_rank_prev'] = stats.score_rank_prev || '';
    prevStatValues['score_rank_next'] = stats.score_rank_next || '';
}

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

function getStatLabel(key) {
    return STAT_META[key]?.label || key;
}

window.displayStats = displayStats;
window.setCurrentGamemode = setCurrentGamemode;
window.getCurrentGamemode = getCurrentGamemode;
window.getUsableStatsForGamemode = getUsableStatsForGamemode;
window.migrateStatSettings = migrateStatSettings;
window.applyStatVisibility = applyStatVisibility;
window.rerenderStatDiffs = rerenderStatDiffs;
window.updateFetchTimerDisplay = window.timer.updateFetchTimerDisplay;

window.addEventListener('DOMContentLoaded', async () => {
    window.migrateStatSettings();
    window.generateStatSettingsCheckboxes();
    let gamemode = 'osu';
    if (window.osuAPI?.getUserConfig) {
        const config = await window.osuAPI.getUserConfig();
        gamemode = config.mode || 'osu';
        const saved = await window.osuAPI.getStatSettings?.() || {};
        if (saved.mode !== gamemode) {
            saved.mode = gamemode;
            localStorage.setItem('statSettings', JSON.stringify(saved));
        }
    }
    generateStatsGrid();
    applyStatVisibility();
    setupScoreRankHover();
    if (typeof window.updateStatCheckboxesForGamemode === 'function') {
        window.updateStatCheckboxesForGamemode(gamemode);
    }
    await displayStats(true);
    window.timer.startPolling(displayStats);
}, { once: true });