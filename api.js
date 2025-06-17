let uid = 41;
let mode = 0;
let initialData = null;
let refetchInterval = 5000;

function toggleUID() {
    uid = uid === 41 ? 1885 : 41;
}

async function fetchUserData() {
    toggleUID();

    try {
        const response = await fetch(`https://api.titanic.sh/users/${uid}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        if (initialData === null) {
            initialData = JSON.parse(JSON.stringify(json));
        }
        displayUserData(json, initialData);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

function displayUserData(json, initialData) {
    const stats = json.stats.find(s => s.mode === mode);
    const initialStats = initialData?.stats.find(s => s.mode === mode);
    const homeStatsContainer = document.getElementById('home-stats');
    const fragment = document.createDocumentFragment();

    const statDefinitions = [
        { id: 'pp', label: 'PP', value: stats.pp, initial: initialStats?.pp, precision: 2 },
        { id: 'ppv1', label: 'PPv1', value: stats.ppv1, initial: initialStats?.ppv1, precision: 2 },
        { id: 'rank', label: 'Rank', value: stats.rank, initial: initialStats?.rank, prefix: '#', invertDelta: true },
        { id: 'acc', label: 'Accuracy', value: stats.acc * 100, initial: initialStats?.acc * 100, precision: 3, suffix: '%' },
    ];

    const createElement = (tag, properties = {}, children = []) => {
        const element = document.createElement(tag);
        Object.assign(element, properties);
        children.forEach(child => element.appendChild(child));
        return element;
    };

    statDefinitions.forEach(({ id, label, value, initial, precision = 0, prefix = '', suffix = '', invertDelta = false }) => {
        const labelDivStats = createElement('div', { id, textContent: `${label}:` });
        const divStats = createElement('div', { id: `stat-${id}`, textContent: `${prefix}${value.toFixed(precision)}${suffix}` });
        const delta = value - initial;
        const divStatsDelta = createElement('div', { id: `delta-${id}`, textContent: (delta !== 0) ? `${invertDelta ? (delta > 0 ? '-' : '+') : (delta > 0 ? '+' : '-')}${Math.abs(delta).toFixed(precision)}` : '' });
        const statRow = createElement('div', { className: 'stat-row' }, [labelDivStats, divStats, divStatsDelta]);
        fragment.appendChild(statRow);
    });

    homeStatsContainer.replaceChildren(fragment);
}

fetchUserData(); // initial fetch before refresh timer
setInterval(fetchUserData, refetchInterval);