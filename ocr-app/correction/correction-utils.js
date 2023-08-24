function editDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;

    const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }

    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]) + 1;
            }
        }
    }

    return dp[m][n];
}

function text_is_number(text) {
    let whitelist_numbers = '0123456789';
    for (let i = 0; i < text.length; i++) {
        if (!whitelist_numbers.includes(text[i])) {
            return false
        }
    }
    return true;
}

function text_is_valid_day(text) {
    if (text.length != 2) return false;
    if (!text_is_number(text)) return false;
    if (text < 1 || text > 31) return false;
    return true;
}

function text_is_valid_month(text) {
    if (text.length != 2) return false;
    if (!text_is_number(text)) return false;
    if (text < 1 || text > 12) return false;
    return true;
}

function text_is_valid_year(text) {
    // get current year
    let current_year = new Date().getFullYear();
    if (text.length != 4) return false;
    if (!text_is_number(text)) return false;
    if (parseInt(text) < 1900 || parseInt(text) > current_year) return false;
    return true;
}

module.exports = {
    editDistance,
    text_is_number,
    text_is_valid_day,
    text_is_valid_month,
    text_is_valid_year
}