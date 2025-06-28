const axios = require('axios');
require('dotenv').config();

let token = null;
let tokenExpiry = null;
let uidList = ["19381776", "11196666"];
let uidIndex = 0;
let mode = "osu";

function toggleUid() {
    uidIndex = 1 - uidIndex;
    return uidList[uidIndex];
}

async function getToken() {
    if (token && Date.now() < tokenExpiry) 
        return token;

    const CLIENT_ID = process.env.CLIENT_ID;
    const CLIENT_SECRET = process.env.CLIENT_SECRET;
    const body = {  
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
        scope: "public"
    };
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    };

    try {
        const response = await axios.post('https://osu.ppy.sh/oauth/token', body, { headers });
        console.log("Status code:", response.status);
        token = response.data.access_token;
        tokenExpiry = Date.now() + response.data.expires_in * 1000;
        return token;
    } 
    catch (error) {
        console.error(error.response?.data || error.message);
        return null;
    }
}

async function getDataOsu() {
    uid = toggleUid();

    const token = await getToken();
    
    if (!token)
        return;

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    try {
        const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${uid}?mode=${mode ?? "osu"}`, { headers });
        // console.log(response.data);
        return response.data;
    } 
    catch (error) {
        console.error("API request error:", error.response?.data || error.message);
        return null;
    }
}

async function getDataRespektive() {
    try {
        const response = await axios.get(`https://score.respektive.pw/u/${uid}?mode=${mode ?? "osu"}`)
        // console.log(scoreRank);
        return response.data[0];
    } catch (error) {
        console.error(error.response?.data || error.message);
        return null;
    }
}

async function getCombinedData() {
    const data = await Promise.all([getDataOsu(), getDataRespektive()]);
    return data;
}

module.exports = {
    getCombinedData
};