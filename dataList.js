function dataList(dataOsu, dataRespektive) {
    return [
        { id: 'avatar', label: 'Avatar', value: dataOsu.avatar_url },
        { id: 'username', label: 'Username', value: dataOsu.username },
        { id: 'team', label: 'Team', value: dataOsu.team.short_name },
        { id: 'pp', label: 'PP', value: dataOsu.statistics.pp },
        { id: 'pp_rank', label: 'PP Rank', value: dataOsu.statistics.global_rank },
        { id: 'pp_rank_highest', label: 'Highest PP Rank', value: dataOsu.rank_highest.rank },
        { id: 'score_rank', label: 'Score Rank', value: dataRespektive.rank },
        { id: 'ranked_score', label: 'Ranked Score', value: dataOsu.statistics.ranked_score },
        { id: 'score_prev_user', label: 'Previous Score Rank User', value: dataRespektive.prev.username},
        { id: 'score_prev_score', label: 'Previous User Score Rank', value: dataRespektive.prev.score},
        { id: 'score_next_user', label: 'Next Score Rank User', value: dataRespektive.next.username},
        { id: 'score_next_score', label: 'Next User Score Rank', value: dataRespektive.next.score},
        { id: 'total_score', label: 'Total Score', value: dataOsu.statistics.total_score },
        { id: 'acc', label: 'Accuracy', value: dataOsu.statistics.hit_accuracy },
        { id: 'level', label: 'Level', value: dataOsu.statistics.level.current },
        { id: 'level_progress', label: 'Level Progress', value: dataOsu.statistics.level.progress },
        { id: 'play_count', label: 'Play Count', value: dataOsu.statistics.play_count },
        { id: 'play_time', label: 'Play Time', value: dataOsu.statistics.play_time },
        { id: 'replays_watched', label: 'Replays Watched', value: dataOsu.statistics.replays_watched_by_others },
        { id: 'grade_total_ss', label: 'Total SS', value: dataOsu.statistics.grade_counts.ssh + dataOsu.statistics.grade_counts.ss },
        { id: 'grade_ssh', label: 'SSH', value: dataOsu.statistics.grade_counts.ssh },
        { id: 'grade_ss', label: 'SS', value: dataOsu.statistics.grade_counts.ss },
        { id: 'grade_total_s', label: 'Total S', value: dataOsu.statistics.grade_counts.sh + dataOsu.statistics.grade_counts.s },
        { id: 'grade_sh', label: 'SH', value: dataOsu.statistics.grade_counts.sh },
        { id: 'grade_s', label: 'S', value: dataOsu.statistics.grade_counts.s },
        { id: 'grade_a', label: 'A', value: dataOsu.statistics.grade_counts.a },
        { id: 'highest_combo', label: 'Highest Combo', value: dataOsu.statistics.maximum_combo },
        { id: 'count_300', label: '300 Count', value: dataOsu.statistics.count_300 },
        { id: 'count_100', label: '100 Count', value: dataOsu.statistics.count_100 },
        { id: 'count_50', label: '50 Count', value: dataOsu.statistics.count_50 },
        { id: 'count_0', label: 'Misses', value: dataOsu.statistics.count_miss },
    ];
}

module.exports = { dataList };