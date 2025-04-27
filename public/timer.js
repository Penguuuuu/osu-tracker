let fetchInterval = 5;
let nextFetchTimestamp = null;
let pollIntervalId = null;
const timerAnimationFrames = ['.', '..', '...'];

async function shouldShowTimer() {
    const saved = JSON.parse(localStorage.getItem('statSettings') || '{}');
    if (window.osuAPI?.credentialsSet) {
        const credsOk = await window.osuAPI.credentialsSet();
        if (!credsOk) return false;
    }
    return saved.showTimer !== false;
}

async function updateFetchTimerDisplay(text) {
    const timerEl = document.getElementById('fetch-timer');
    if (!timerEl) return;
    const show = await shouldShowTimer();
    timerEl.style.display = show ? '' : 'none';
    if (show && timerEl.textContent !== text) {
        timerEl.textContent = text;
    } else if (!show && timerEl.textContent !== '') {
        timerEl.textContent = '';
    }
}

let isPolling = false;

function stopPolling() {
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
    isPolling = false;
}

function startPolling(displayStats) {
    if (isPolling) return;
    isPolling = true;
    nextFetchTimestamp = Date.now() + fetchInterval * 1000;
    pollIntervalId = setInterval(async () => {
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.ceil((nextFetchTimestamp - now) / 1000));
        if (secondsLeft > 0) {
            requestAnimationFrame(() => updateFetchTimerDisplay(`Next fetch in ${secondsLeft}s`));
        } else {
            requestAnimationFrame(() => updateFetchTimerDisplay('Fetching'));
            stopPolling();
            try {
                await displayStats(true);
            } finally {
                startPolling(displayStats);
            }
        }
    }, 1000);
}

function startTimerAnimation(updateFn) {
    let timerAnimationActive = true;
    let timerAnimationLocalIndex = 0;
    const interval = setInterval(() => {
        if (!timerAnimationActive) {
            clearInterval(interval);
            return;
        }
        updateFn(`Fetching${timerAnimationFrames[timerAnimationLocalIndex % timerAnimationFrames.length]}`);
        timerAnimationLocalIndex++;
    }, 400);
    return () => { timerAnimationActive = false; };
}

function getSecondsToMidnightUTC() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const secondsToday = utcHours * 3600 + utcMinutes * 60 + utcSeconds;
    const secondsInDay = 24 * 3600;
    return secondsInDay - secondsToday;
}

function getSecondsToNextThursdayUTC() {
    const now = new Date();
    const utcDay = now.getUTCDay();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    let daysUntilThursday = (3 - utcDay + 7) % 7;
    if (daysUntilThursday === 0 && (utcHours > 0 || utcMinutes > 0 || utcSeconds > 0)) {
        daysUntilThursday = 7;
    }
    const secondsToday = utcHours * 3600 + utcMinutes * 60 + utcSeconds;
    const secondsToMidnight = 24 * 3600 - secondsToday;
    return daysUntilThursday * 24 * 3600 + secondsToMidnight;
}

function formatCountdown(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    let result = [];
    if (d) result.push(`${d}d`);
    if (h || d) result.push(`${h}h`);
    if (m || h || d) result.push(`${m}m`);
    result.push(`${s}s`);
    return result.join(' ');
}

async function shouldShowDailyTimer() {
    const saved = JSON.parse(localStorage.getItem('statSettings') || '{}');
    return saved.showDailyTimer !== false;
}

async function shouldShowWeeklyTimer() {
    const saved = JSON.parse(localStorage.getItem('statSettings') || '{}');
    return saved.showWeeklyTimer !== false;
}

const timerDisplays = [
    {
        elementId: 'daily-timer',
        shouldShowFn: shouldShowDailyTimer,
        getSecondsFn: getSecondsToMidnightUTC,
        label: 'Daily reset'
    },
    {
        elementId: 'weekly-timer',
        shouldShowFn: shouldShowWeeklyTimer,
        getSecondsFn: getSecondsToNextThursdayUTC,
        label: 'Weekly reset'
    }
];

let sharedTimerInterval = null;

async function updateAllTimerDisplays() {
    const updates = timerDisplays.map(async (timer) => {
        const el = document.getElementById(timer.elementId);
        if (!el) return;
        const show = await timer.shouldShowFn();
        el.style.display = show ? '' : 'none';
        if (!show) {
            el.textContent = '';
            return;
        }
        let secs = timer.getSecondsFn();
        if (isNaN(secs) || secs < 0) secs = 0;
        el.textContent = `${timer.label} in: ${formatCountdown(secs)}`;
    });
    await Promise.all(updates);
}

function startSharedTimerInterval() {
    if (sharedTimerInterval) return;
    updateAllTimerDisplays();
    sharedTimerInterval = setInterval(() => {
        requestAnimationFrame(updateAllTimerDisplays);
    }, 1000);
}

function stopSharedTimerInterval() {
    if (sharedTimerInterval) {
        clearInterval(sharedTimerInterval);
        sharedTimerInterval = null;
    }
}

window.updateDailyTimerDisplay = updateAllTimerDisplays;
window.updateWeeklyTimerDisplay = updateAllTimerDisplays;

window.addEventListener('DOMContentLoaded', () => {
    startSharedTimerInterval();
});

window.timer = {
    fetchInterval,
    timerAnimationFrames,
    nextFetchTimestamp,
    shouldShowTimer,
    updateFetchTimerDisplay,
    stopPolling,
    startPolling,
    startTimerAnimation
};