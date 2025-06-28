const { getCombinedData } = require('./api');
const { dataList } = require('./dataList');
const dataConfig = require('./dataConfig');

const containerUser = document.getElementById('home-user');
const containerUserDetails = document.getElementById('home-user-details');
const containerStats = document.getElementById('home-stats');

let lastData = null;
const fetchInterval = 5000;

async function main() {
    const data = await getCombinedData();
    if (JSON.stringify(data) !== JSON.stringify(lastData)) {
        lastData = data;
        const getData = dataList(...data);
        displayUser(getData);
        displayStats(getData);
    }
}

function displayUser(getData) { 
    const getDataById = id => getData.find(stat => stat.id === id);
    const avatar = getDataById('avatar');
    const username = getDataById('username');
    const team = getDataById('team');

    let avatarImg = document.getElementById(avatar.id);
    if (!avatarImg) {
        avatarImg = document.createElement('img');
        avatarImg.id = avatar.id;
    }
    if (avatarImg.src !== avatar.value) {
        avatarImg.src = avatar.value;
    }

    let wrapper = document.querySelector('.user-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'user-wrapper';

        const usernameSpan = document.createElement('span');
        usernameSpan.id = username.id;
        usernameSpan.textContent = username.value;

        const teamSpan = document.createElement('span');
        teamSpan.id = team.id;
        teamSpan.textContent = `[${team.value}]`;

        wrapper.append(usernameSpan, teamSpan);
    }

    const usernameSpan = wrapper.querySelector(`#${username.id}`);
    if (usernameSpan.textContent !== username.value) {
        usernameSpan.textContent = username.value;
    }

    const teamSpan = wrapper.querySelector(`#${team.id}`);
    const teamText = `[${team.value}]`;
    if (teamSpan.textContent !== teamText) {
        teamSpan.textContent = teamText;
    }

    containerUser.append(avatarImg);
    containerUser.append(containerUserDetails);
    containerUserDetails.append(wrapper);
}


function displayStats(getData) {
    const excluded = ['avatar', 'username', 'team'];

    getData
        .filter(stat => !excluded.includes(stat.id) && dataConfig[stat.id])
        .forEach(stat => {
            let container = document.getElementById(stat.id);
            if (!container) {
                container = document.createElement('span');
                container.id = stat.id;

                const labelSpan = document.createElement('span');
                labelSpan.className = 'stat-label';
                labelSpan.textContent = `${stat.label}:`;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'stat-value';
                valueSpan.textContent = stat.value;

                container.append(labelSpan, valueSpan);
                containerStats.appendChild(container);
            }
            
            const valueSpan = container.querySelector('.stat-value');
            if (valueSpan && valueSpan.textContent !== String(stat.value)) {
                valueSpan.textContent = stat.value;
            }
        });
}

main();
setInterval(main, fetchInterval);