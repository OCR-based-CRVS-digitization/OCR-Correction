
const correctiondb = require('../db-query/correction-db');
const utils = require('./correction-utils.js');
const fs = require('fs');

whitelist_numbers = '0123456789'
whitelist_characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ().,;:\'\"'




function getSuggestionsFromRowNameField(text, rows) {
    let suggestions = [];
    let suggestion_ids = [];
    let min = 1000;
    for (let row of rows) {
        let distance = utils.editDistance(text, row.name);
        if (min == 1000 || distance < min) {
            min = distance;
            suggestions = []
            suggestion_ids = []
            suggestions.push(row.name);
            suggestion_ids.push(row.id)
        }
        else if (distance == min) {
            suggestions.push(row.name);
            suggestion_ids.push(row.id)
        }
        if (min == 0 )
            return {suggestions : [], suggestion_ids : []};
    }
    return {suggestions, suggestion_ids};
}


async function getSuggestionsAndErrors(text, correction, field_type, suggested_address) {
    let correction_type = correction.type;
    let correction_details = correction.details;
    let suggestions = [];
    let errors = "";

    // CHECKBOXES only needs to check for multiple entries
    if(field_type == 'CHECKBOX') {
        if (text.length > 1) {
            errors = text.length.to_string() + " entries found";
        }
        return {suggestions, errors};
    }
    if(text == '') {
        errors = "Empty field";
        return {suggestions, errors};
    }


    // now for DATE, DIGIT, EDIT DISTANCE of ADDRESSES
    switch(correction_type) {
        //#####################################
        //######### ADDRESS CORRECTION ########
        //#####################################
        case 'EDIT':
            if (correction_details == 'DIVISION') {
                let divisionRows = await correctiondb.getDivisions();
                let result = getSuggestionsFromRowNameField(text, divisionRows);
                suggestions = result.suggestions;
                suggested_address.division_ids = result.suggestion_ids;
                if (suggestions.length != 0) {
                    errors = "Division might have error";
                }
                
            }
            else if (correction_details == 'DISTRICT') 
            {
                let districtRows = await correctiondb.getDistricts();
                let result = getSuggestionsFromRowNameField(text, districtRows);
                suggestions = result.suggestions;
                suggested_address.district_ids = result.suggestion_ids;
                if (suggestions.length != 0) {
                    errors = "District might have error";
                }
            } 
            else if (correction_details == 'UPAZILLA_THANA') 
            {
                let upazillaRows = await correctiondb.getUpazillasOfDistrict(suggested_address.district_ids);
                let result = getSuggestionsFromRowNameField(text, upazillaRows);
                suggestions = result.suggestions;
                suggested_address.upazilla_ids = result.suggestion_ids;

                let thanaRows = await correctiondb.getThanasOfDistrict(suggested_address.district_ids);
                result = getSuggestionsFromRowNameField(text, thanaRows);
                // console.log("in thana")
                // console.log(thanaRows);
                suggestions = suggestions.concat(result.suggestions);
                if (suggestions.length != 0) {
                    errors = "Upazilla/Thana might have error";
                }
            } 
            else if (correction_details == 'CITYCORPORATION_PAURASHAVA') 
            {
                let citycorporationRows = await correctiondb.getCitycorporationsOfDistrict(suggested_address.district_ids);
                let result = getSuggestionsFromRowNameField(text, citycorporationRows);
                suggestions = result.suggestions;
                suggested_address.citycorporation_ids = result.suggestion_ids;

                let paurashavaRows = await correctiondb.getPaurashavasOfDistrict(suggested_address.district_ids);
                result = getSuggestionsFromRowNameField(text, paurashavaRows);
                suggestions = suggestions.concat(result.suggestions);
                suggested_address.paurashava_ids = result.suggestion_ids;
                if (suggestions.length != 0) {
                    errors = "Citycorporation/Paurashava might have error";
                }
            } 
            else if (correction_details == 'POST_OFFICE') 
            {
                let postofficeRows = await correctiondb.getPostofficesOfDistrict(suggested_address.district_ids);
                let result = getSuggestionsFromRowNameField(text, postofficeRows);
                suggestions = result.suggestions;
                suggested_address.postoffice_ids = result.suggestion_ids;
                if (suggestions.length != 0) {
                    errors = "Postoffice might have error";
                }
            } 
            else if (correction_details == 'UNION') 
            {
                let unionRows = await correctiondb.getUnionsOfUpazilla(suggested_address.upazilla_ids);
                let result = getSuggestionsFromRowNameField(text, unionRows);
                suggestions = result.suggestions;
                if (suggestions.length != 0) {
                    errors = "Union might have error";
                }
            }
            else if (correction_details == 'WARDNUMBER') {
                let sug_city_corps = suggested_address.citycorporation_ids.length;
                let sug_paurashavas = suggested_address.paurashava_ids.length;
                if (sug_city_corps + sug_paurashavas != 1 ) {
                    // meaning there are multiple citycorporations/paurashava suggestions so multiple wards
                    errors = "multple suggestions for citycorporation/paurashava. Need manual validation";
                    break;
                }
                if (sug_city_corps == 1 ){
                    let maxWardsOfCityCorp = await correctiondb.getMaxWardOfCitycorporation(suggested_address.citycorporation_ids[0]);
                    if (parseInt(text) > maxWardsOfCityCorp) {
                        errors = "Ward number exceeds max ward number of citycorporation";
                    }
                }
                else if (sug_paurashavas == 1) {
                    let maxWardsOfPaurashava = await correctiondb.getMaxWardOfPaurashava(suggested_address.paurashava_ids[0]);
                    if (parseInt(text) > maxWardsOfPaurashava) {
                        errors = "Ward number exceeds max ward number of paurashava";
                    }
                }
            }
            else if (correction_details == 'POST_CODE') {
                
                if (text.length != 4) {
                    errors = "Number length should be " + 4;
                    break;
                }
                if (!utils.text_is_number(text)) {
                    errors = "Number should only contain digits";
                    break;
                }
                let sug_postoffices = suggested_address.postoffice_ids.length;
                if (sug_postoffices == 0) {
                    errors = "inadequate suggestions for postoffice. Need manual validation";
                    break;
                }
                if (sug_postoffices > 1 ) {
                    // meaning there are multiple postoffice suggestions so multiple postcodes
                    errors = "multple suggestions for postoffice. Need manual validation";
                    break;
                }
                //! assuming my edit distance is working very well
                let post_code = await correctiondb.getPostCodeOfPostoffice(suggested_address.postoffice_ids[0]);
                if (parseInt(text) != post_code) {
                    errors = "Post code does not match with postoffice";
                }
                
            }
            break;

        case 'DIGIT':
            let number_length = parseInt(correction_details);
            if (text.length != number_length) {
                errors = "Number length should be " + number_length;
            }
            if (!utils.text_is_number(text)) {
                errors = "Number should only contain digits";
            }
            break;

        case 'DATE':
            if (correction_details == 'DAY') {
                if (!utils.text_is_valid_day(text)) {
                    errors = "Invalid day";
                }
            } else if (correction_details == 'MONTH') {
                if (!utils.text_is_valid_month(text)) {
                    errors = "Invalid month";
                }
            } else if (correction_details == 'YEAR') {
                if (!utils.text_is_valid_year(text)) {
                    errors = "Invalid year";
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
    suggested_address = {
        division_ids: [],
        district_ids: [],
        upazilla_ids: [],
        citycorporation_ids: [],
        paurashava_ids: [],
        postoffice_ids: []
    }
    for (let field of ocr_output) {
        let correction = field.correction;
        let text = field.text;
        let {suggestions, errors} = await getSuggestionsAndErrors(text, correction, field.field_type, suggested_address);
        let correction_needed = suggestions.length > 0 || errors.length != "";
        form_output[field.name] = {
            text,
            correction_needed,
            suggestions,
            errors
        };
    }
    // console.log(suggested_address);
    return form_output;
}

// correct('../ocr/ocr_output/ocr_1.json', '1')


module.exports = {
    whitelist_numbers,
    whitelist_characters,
    correct
}