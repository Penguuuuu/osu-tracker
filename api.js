let uid = 1885;
let mode = 0;
let initialData = null;
let refetchInterval = 5000;

function toggleUID() {
    uid = uid === 1885 ? 41 : 1885;
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
            console.log('Initial:', initialData);
        }
        displayUserData(json);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

function displayUserData(json) {
    const stats = json.stats.find(s => s.mode === mode);
    const homeStatsContainer = document.getElementById('home-stats');
    const optionsStatsContainer = document.getElementById('options-stats');

    homeStatsContainer.innerHTML = '';
    optionsStatsContainer.innerHTML = '';

    const statDefinitions = [
        { id: 'pp',   label: 'PP',       value: stats.pp },
        { id: 'ppv1', label: 'PPv1',     value: stats.ppv1 },
        { id: 'rank', label: 'Rank',     value: stats.rank },
        { id: 'acc',  label: 'Accuracy', value: stats.acc === 0 ? '0' : (stats.acc * 100).toFixed(3) + '%' },
    ];

    const createElement = (tag, properties = {}, children = []) => {
        const element = document.createElement(tag);
        Object.entries(properties).forEach(([id, value]) => element[id] = value);
        children.forEach(child => element.appendChild(child));
        return element;
    };

    statDefinitions.forEach(({ id, label, value }) => {
        const divStats = createElement('div', { id, textContent: `${label}: ${value}` });
        const checkboxStats = createElement('input', { type: 'checkbox', checked: true, id: `checkbox-${id}` });
        const labelStats = createElement('label', { htmlFor: checkboxStats.id, textContent: label });

        checkboxStats.addEventListener('change', () => {
            divStats.style.display = checkboxStats.checked ? 'block' : 'none';
        });

        homeStatsContainer.appendChild(divStats);
        optionsStatsContainer.appendChild(labelStats);
        optionsStatsContainer.appendChild(checkboxStats);
    });
}

fetchUserData(); //initial fetch before refresh timer
setInterval(fetchUserData, refetchInterval);
