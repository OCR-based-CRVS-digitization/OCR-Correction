
const correctiondb = require('../db-query/correction-db');
const utils = require('./correction-utils.js');

whitelist_numbers = '0123456789'
whitelist_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ().,;:\'\"'




async function getSuggestions(text, correction) {
    let correction_type = correction.type;
    let correction_details = correction.details;
    let suggestions = [];
    let errors = [];

    switch(correction_type) {
        case 'EDIT':
            if (correction_details == 'DISTRICT') {
                let districtRows = await correctiondb.getDistricts();
                let min = 1000;
                for (let districtRow of districtRows) {
                    let distance = utils.editDistance(text, districtRow.name);
                    if (min == 1000 || distance < min) {
                        min = distance;
                        suggestions = []
                        suggestions.push(districtRow.name);
                    }
                    else if (distance == min) {
                        suggestions.push(districtRow.name);
                    }
                }
                if (min == 0)
                    return {suggestions, errors};
            }
            break;

        case 'DIGIT':
            let number_length = parseInt(correction_details);
            if (text.length != number_length) {
                errors.push("Number length should be " + number_length);
            }
            if (!utils.text_is_number(text)) {
                errors.push("Number should only contain digits");
            }
            break;

        case 'DATE':
            if (correction_details == 'DAY') {
                if (!utils.text_is_valid_day(text)) {
                    errors.push("Invalid day");
                }
            } else if (correction_details == 'MONTH') {
                if (!utils.text_is_valid_month(text)) {
                    errors.push("Invalid month");
                }
            } else if (correction_details == 'YEAR') {
                if (!utils.text_is_valid_year(text)) {
                    errors.push("Invalid year");
                }
            }
            break;
        case 'NONE':
            break;
        default:
            console.log("Invalid correction type");
            break;
    }
    return {suggestions, errors};
}




module.exports = {
    whitelist_numbers,
    whitelist_characters,
    getSuggestions
}