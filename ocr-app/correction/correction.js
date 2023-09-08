
const correctiondb = require('../db-query/correction-db');
const utils = require('./correction-utils.js');
const fs = require('fs');

whitelist_numbers = '0123456789'
whitelist_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ().,;:\'\"'




function getSuggestionsFromRowNameField(text, rows) {
    let suggestions = [];
    let min = 1000;
    for (let row of rows) {
        let distance = utils.editDistance(text, row.name);
        if (min == 1000 || distance < min) {
            min = distance;
            suggestions = []
            suggestions.push(row.name);
        }
        else if (distance == min) {
            suggestions.push(row.name);
        }
    }
    // if (min == 0)
    //     return suggestions;
    if (min == 0)
        return [];
    return suggestions;
}


async function getSuggestionsAndErrors(text, correction, field_type, suggested_address) {
    let correction_type = correction.type;
    let correction_details = correction.details;
    let suggestions = [];
    let errors = [];

    // CHECKBOXES only needs to check for multiple entries
    if(field_type == 'CHECKBOX') {
        if (text.length > 1) {
            errors.push(text.length.to_string() + " entries found");
        }
        return {suggestions, errors};
    }
    if(text == '') {
        errors.push("Empty field");
        return {suggestions, errors};
    }


    // now for DATE, DIGIT, EDIT DISTANCE of ADDRESSES
    switch(correction_type) {
        //#####################################
        //######### ADDRESS CORRECTION ########
        //#####################################
        case 'EDIT':
            if (correction_details == 'DISTRICT') {
                let districtRows = await correctiondb.getDistricts();
                suggestions = getSuggestionsFromRowNameField(text, districtRows);
                suggested_address.districts = suggestions;
                if (suggestions.length != 0) {
                    errors.push("District might have error");
                }
            }
            // else if (correction_details == 'DIVISION') 
            // {
            //     let divisionRows = await correctiondb.getDivisions();
            //     suggestions = getSuggestionsFromRowNameField(text, divisionRows);
            //     suggested_address.divisions = suggestions;
            //     if (suggestions.length != 0) {
            //         errors.push("Division might have error");
            //     }
            // } else if (correction_details == 'UPAZILLA_THANA') {
            //     let upazilla = await correctiondb.getUpazillasOfDistrict(suggested_address.districts);
            //     suggestions = getSuggestionsFromRowNameField(text, upazilla_thana);
            // }
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


async function correct(ocr_result_file_name) {
    let ocr_output = JSON.parse(fs.readFileSync(ocr_result_file_name));
    let form_output = {};
    let suggested_address = {
        divisions: [],
        districts: [],
        upazillas: [],
        citycorporations: [],
        paurashavas: [],
        postoffices: []
    }
    for (let field of ocr_output) {
        let correction = field.correction;
        let text = field.text;
        let {suggestions, errors} = await getSuggestionsAndErrors(text, correction, field.field_type, suggested_address);
        let correction_needed = suggestions.length > 0 || errors.length > 0;
        form_output[field.name] = {
            text,
            correction_needed,
            suggestions,
            errors
        };
    }
    return form_output;
}

// correct('../ocr/ocr_output/ocr_1.json', '1')


module.exports = {
    whitelist_numbers,
    whitelist_characters,
    correct
}