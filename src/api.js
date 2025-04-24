const axios = require('axios');
const levelCalculator = require('./levelcalc');

const OSU_API_URL = 'https://osu.ppy.sh/api/v2/users/';
const AMAYAKASE_API_URL = 'https://api.kirino.sh/inspector/users/stats/';
const RESPEKTIVE_API_URL = 'https://score.respektive.pw/u/';

const getAccessToken = async (clientId, clientSecret) => {
    try {
        const response = await axios.post('https://osu.ppy.sh/oauth/token', {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope: 'public'
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.message);
        return null;
    }
};

const getStats = async (uid, mode, clientId, clientSecret) => {
    if (!uid) return null;

    try {
        const accessToken = await getAccessToken(clientId, clientSecret);
        if (!accessToken) return null;

        const [{ data: osu }, { data: { stats: amayakase } }, { data: [respektive] }] = await Promise.all([
            axios.get(`${OSU_API_URL}${uid}/${mode}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
            axios.get(`${AMAYAKASE_API_URL}${uid}`),
            axios.get(`${RESPEKTIVE_API_URL}${uid}?mode=${mode}`)
        ]);

        return {
            // osu! Stats
            username:        osu?.username,
            country:         osu?.country_code,
            rank_global:     osu?.statistics?.global_rank,
            rank_country:    osu?.statistics?.country_rank,
            pp:              osu?.statistics?.pp,
            score_ranked:    osu?.statistics?.ranked_score,
            score_total:     osu?.statistics?.total_score,
            accuracy:        osu?.statistics?.hit_accuracy,
            rank_ssh:        osu?.statistics?.grade_counts?.ssh,
            rank_ss:         osu?.statistics?.grade_counts?.ss,
            rank_sh:         osu?.statistics?.grade_counts?.sh,
            rank_s:          osu?.statistics?.grade_counts?.s,
            rank_a:          osu?.statistics?.grade_counts?.a,
            rank_s_total:    osu?.statistics?.grade_counts?.s + osu?.statistics?.grade_counts?.sh,
            rank_ss_total:   osu?.statistics?.grade_counts?.ss + osu?.statistics?.grade_counts?.ssh,
            play_count:      osu?.statistics?.play_count,
            play_time:       osu?.statistics?.play_time,
            count_hits:      osu?.statistics?.total_hits,
            count_300:       osu?.statistics?.count_300,
            count_100:       osu?.statistics?.count_100,
            count_50:        osu?.statistics?.count_50,
            count_0:         osu?.statistics?.count_miss,
            replays_watched: osu?.statistics?.replays_watched_by_others,
            followers:       osu?.follower_count,
            avatar_url:      osu?.avatar_url,
            top_10_daily:    osu?.daily_challenge_user_stats?.top_10p_placements,
            top_50_daily:    osu?.daily_challenge_user_stats?.top_50p_placements,
            weekly_best:     osu?.daily_challenge_user_stats?.weekly_streak_best,
            weekly_current:  osu?.daily_challenge_user_stats?.weekly_streak_current,
            daily_best:      osu?.daily_challenge_user_stats?.daily_streak_best,
            daily_streak:    osu?.daily_challenge_user_stats?.top_50p_placements,

            // Amayakase Stats
            rank_b:          amayakase?.b,
            rank_c:          amayakase?.c,
            rank_d:          amayakase?.d,
            total_pp:        amayakase?.total_pp,
            clears:          mode === 'osu'
                                ? Number(amayakase?.profile_clears ?? 0)
                                : (
                                    (Number(osu?.statistics?.grade_counts?.ssh ?? 0)) +
                                    (Number(osu?.statistics?.grade_counts?.ss ?? 0)) +
                                    (Number(osu?.statistics?.grade_counts?.sh ?? 0)) +
                                    (Number(osu?.statistics?.grade_counts?.s ?? 0)) +
                                    (Number(osu?.statistics?.grade_counts?.a ?? 0))
                                ),
            clears_loved:    Number(amayakase?.clears ?? 0),
            completion:      amayakase?.completion,
            rank_global_ss:  amayakase?.global_ss_rank,
            rank_country_ss: amayakase?.country_ss_rank,
            top50s:          amayakase?.top50s,


            score_rank:      respektive?.rank,
            score_rank_next: respektive?.next?.username,
            score_next:      respektive?.next?.score,
            score_rank_prev: respektive?.prev?.username,
            score_prev:      respektive?.prev?.score,

            // Custom Stats
            level:           osu?.statistics?.total_score && levelCalculator.calculateLevel(osu.statistics.total_score),
        };
    } catch (error) {
        console.error('Error fetching stats:', error.message);
        return null;
    }
};

module.exports = {
    getStats
};