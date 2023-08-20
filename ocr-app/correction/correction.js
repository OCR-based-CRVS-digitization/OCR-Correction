
const correctiondb = require('../db-query/correction-db');

whitelist_numbers = '0123456789'
whitelist_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ().,;:\'\"'




async function getSuggestions(text, correction) {
    let correction_type = correction.type;
    let correction_details = correction.details;
    let suggestions = [];

    

    if(correction_type == 'EDIT') {
        if(correction_details == 'DISTRICT') {
            let districtRows = await correctiondb.getDistricts();

            let min = 1000;
            for(let districtRow of districtRows) {
                let distance = editDistance(text, districtRow.name);
                if(min == 1000 || distance < min) {
                    min = distance;
                    suggestions = []
                    suggestions.push(districtRow.name);
                }
                else if(distance == min) {
                    suggestions.push(districtRow.name);
                }
            }
            if (min == 0)
                return [];
        }
    }
    else if(correction_type == 'DIGIT') {
        let number_length = parseInt(correction_details);
        if (text.length != number_length) {
            suggestions.push("Number length should be " + number_length);
        }
        // check if all character of text is digit
        let isDigit = true;
        for(let i = 0; i < text.length; i++) {
            if(!whitelist_numbers.includes(text[i])) {
                isDigit = false;
                break;
            }
        }
        if(!isDigit) {
            suggestions.push("All characters should be digits");
        }
    }

    return suggestions;
}

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


module.exports = {
    whitelist_numbers,
    whitelist_characters,
    getSuggestions
}