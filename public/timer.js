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