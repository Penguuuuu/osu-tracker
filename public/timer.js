let fetchInterval = 5;
let nextFetchTimestamp = null;
let pollIntervalId = null;
const timerAnimationFrames = ['.', '..', '...'];
let dailyTimerInterval = null;
let weeklyTimerInterval = null;

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

function stopPolling() {
    if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
}

function startPolling(displayStats) {
    if (pollIntervalId) return;
    nextFetchTimestamp = Date.now() + fetchInterval * 1000;
    pollIntervalId = setInterval(async () => {
        const now = Date.now();
        const secondsLeft = Math.max(0, Math.ceil((nextFetchTimestamp - now) / 1000));
        if (secondsLeft > 0) {
            await updateFetchTimerDisplay(`Next fetch in ${secondsLeft}s`);
        } else {
            stopPolling();
            displayStats(true).then(() => {
                startPolling(displayStats);
            });
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

async function updateDailyTimerDisplay() {
    const el = document.getElementById('daily-timer');
    if (!el) return;
    const show = await shouldShowDailyTimer();
    el.style.display = show ? '' : 'none';
    if (!show) {
        el.textContent = '';
        if (dailyTimerInterval) {
            clearInterval(dailyTimerInterval);
            dailyTimerInterval = null;
        }
        return;
    }
    function update() {
        const secs = getSecondsToMidnightUTC();
        el.textContent = `Daily reset in: ${formatCountdown(secs)}`;
    }
    update();
    if (!dailyTimerInterval) {
        dailyTimerInterval = setInterval(update, 1000);
    }
}

async function shouldShowWeeklyTimer() {
    const saved = JSON.parse(localStorage.getItem('statSettings') || '{}');
    return saved.showWeeklyTimer !== false;
}

async function updateWeeklyTimerDisplay() {
    const el = document.getElementById('weekly-timer');
    if (!el) return;
    const show = await shouldShowWeeklyTimer();
    el.style.display = show ? '' : 'none';
    if (!show) {
        el.textContent = '';
        if (weeklyTimerInterval) {
            clearInterval(weeklyTimerInterval);
            weeklyTimerInterval = null;
        }
        return;
    }
    function update() {
        const secs = getSecondsToNextThursdayUTC();
        el.textContent = `Weekly reset in: ${formatCountdown(secs)}`;
    }
    update();
    if (!weeklyTimerInterval) {
        weeklyTimerInterval = setInterval(update, 1000);
    }
}

window.updateDailyTimerDisplay = updateDailyTimerDisplay;
window.updateWeeklyTimerDisplay = updateWeeklyTimerDisplay;

window.addEventListener('DOMContentLoaded', () => {
    updateDailyTimerDisplay();
    updateWeeklyTimerDisplay();
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