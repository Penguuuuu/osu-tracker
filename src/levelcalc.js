const levelCalculator = {
    calculateTotalScore: (() => {
        const memo = new Map();
        return (n) => {
            if (memo.has(n)) return memo.get(n);

            let result;
            if (n <= 100) {
                const term1 = (5000 / 3) * (4 * Math.pow(n, 3) - 3 * Math.pow(n, 2) - n);
                const term2 = 1.25 * Math.pow(1.8, n - 60);
                result = term1 + term2;
            } else {
                result = 26_931_190_827 + 99_999_999_999 * (n - 100);
            }

            memo.set(n, result);
            return result;
        };
    })(),

    calculateLevel: (totalScore) => {
        if (totalScore >= levelCalculator.calculateTotalScore(100)) {
            return 100 + (totalScore - 26_931_190_827) / 99_999_999_999;
        }

        let low = 0;
        let high = 100;

        while (high - low > 1e-6) {
            const mid = (low + high) / 2;
            const scoreAtMid = levelCalculator.calculateTotalScore(mid);

            if (scoreAtMid < totalScore) {
                low = mid;
            } else {
                high = mid;
            }
        }

        return (low + high) / 2;
    }
};

module.exports = levelCalculator;