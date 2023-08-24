const axios = require('axios');
const path = require('path');
const correction = require('./correction/correction')
const { createWorker, createScheduler } = require('tesseract.js');
const Jimp = require('jimp');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');



app=express();
app.use(express.json());
app.post("/",main)


const region_file = '../schema/crvs-schema.json';
const base_image_path = "../form-images/";



async function createFormWithOCRResult(form_id, ocr_result) {
    try{
        const form = await prisma.form_ocr_output.create({
            data: {
                form_id: form_id,
                ocr_result: ocr_result
            },
        });
        return form;
    }
    catch (error) {
        console.error('Error:', error);
    }
}


const downloadImage = async(url, folderPath, fileName) => {
    try {
        // Make a GET request to the image URL
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        // Ensure the folderPath exists
        if (!fs.existsSync(folderPath)) {
            console.log(`Creating directory ${folderPath}`);
            fs.mkdirSync(folderPath, { recursive: true });
        }        
        // Determine the full path to save the image
        const imagePath = path.join(folderPath, fileName);
        // Write the image data to the specified path
        fs.writeFileSync(imagePath, Buffer.from(response.data));

        console.log(`Image downloaded and saved to ${imagePath}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

const calculate_average_brightness = async (imagePath, left, top, width, height) => {
    try {
        const image = await Jimp.read(imagePath);
        const region = image.clone().crop(left, top, width, height);

        let totalBrightness = 0;

        region.scan(0, 0, region.bitmap.width, region.bitmap.height, (x, y, idx) => {
            const red = region.bitmap.data[idx];
            const green = region.bitmap.data[idx + 1];
            const blue = region.bitmap.data[idx + 2];
            const brightness = (red + green + blue) / 3;
            totalBrightness += brightness;
        });

        const averageBrightness = totalBrightness / (region.bitmap.width * region.bitmap.height);
        return averageBrightness;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}


const perform_ocr = async (imagePath, data_type, region, scheduler) => {
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    if ( data_type == 'NUMBER' ) {
        await worker.setParameters({
            tessedit_char_whitelist: correction.whitelist_numbers
        });
    } else if ( data_type == 'STRING' ) {
        await worker.setParameters({
            tessedit_char_whitelist: correction.whitelist_characters
        });
    }
    
    // console.log("Adding worker to scheduler")
    // scheduler.addWorker(worker);
    // console.log("Added worker to scheduler")

    // const results = await Promise.all(Array(1).fill(0).map(() => (
    //     scheduler.addJob('recognize', imagePath, {
    //         rectangle: { left: region[0], top: region[1], width: region[2], height: region[3] },
    //     })
    // )))
    
    // let text = results[0].data.text
    // const { data: { text } } = await scheduler.addJob('recognize', imagePath, {
    //     rectangle: { left: region[0], top: region[1], width: region[2], height: region[3] },
    // });
    // console.log("Job added to scheduler")

    const { data: { text } } = await worker.recognize(imagePath, {
        rectangle: { left: region[0], top: region[1], width: region[2], height: region[3] },
    });
    await worker.terminate();
    return text.trimEnd();
};


const ocr_letter_by_letter = async(imagePath, data_type, regions, scheduler) => {
    let text = ""
    for ( let regionInfo of regions) {
        char = await perform_ocr(imagePath, data_type, regionInfo.region, scheduler)
        char = char.replace(/\n/g, '')
        text += char
    }
    return text.trimEnd()
}

const get_checkbox_input = async (imagePath, regions) => {
    let entries = []
    const brightness_threshold = 3
    for ( let regionInfo of regions) {
        let averageBrightness = await calculate_average_brightness(imagePath, regionInfo.region[0], regionInfo.region[1], regionInfo.region[2], regionInfo.region[3]);
        if ( regionInfo.brightness - averageBrightness > brightness_threshold) {
            entries.push({
                entry : regionInfo.entry,
                index : regionInfo.index
            })
        }
    }
    // console.log(entries)
    return entries
}




async function main(req,res) {
    var form_output = {}
    let imagePaths = []
    const scheduler = createScheduler();

    // //todo each form has 4 pages
    // //todo we can get the url and page number from firebase's db
    // var form_id = req.body.form_id;
    // imagePaths.push({
    //     url : req.body.url,
    //     page_number : 1
    // })
    // //download the image locally
    // for (let imagePath of imagePaths) {
    //     await downloadImage(imagePath.url, base_image_path + form_id + "/jpg/", form_id + "." + imagePath.page_number + ".jpg")
    // }

    let form_id = '1';
    // console.log("Form ID : ", form_id)
    // console.log("Image URL : ", imagePaths[0].url)

    // read json data from crvs-schema.json
    var data = fs.readFileSync(region_file, 'utf8');
    var fields = JSON.parse(data)

    for (let field of fields) {
        // if(field.type == 'OCR_CHAR')
        //     continue;
        
        var imagePath = base_image_path + form_id + "/jpg/" + form_id + "." + field.page_number + ".jpg";
        console.log("Processing : ", field.name);
        // only for first page of the form
        if (field.type == 'OCR_WORD') {
            let region = field.regions[0].region;
            let data_type = field.data_type;
            let ocr_text = await perform_ocr(imagePath, data_type, region, scheduler);
            
            let {suggestions, errors} = await correction.getSuggestions(ocr_text, field.correction);
            let correction_needed = suggestions.length > 0 || errors.length > 0;
            form_output[field.name] = {
                text : ocr_text,
                correction_needed,
                suggestions,
                errors
            };

        } else if (field.type == "OCR_CHAR") {

            let data_type = field.data_type;
            let ocr_text = await ocr_letter_by_letter(imagePath, data_type, field.regions, scheduler);
            let { suggestions, errors } = await correction.getSuggestions(ocr_text, field.correction);
            let correction_needed = suggestions.length > 0 || errors.length > 0;
            form_output[field.name] = {
                text : ocr_text,
                correction_needed,
                suggestions,
                errors
            };


        } else if (field.type == "CHECKBOX") {
            let entries = await get_checkbox_input(imagePath, field.regions)
            let text;
            let errors = [];
            if (entries.length == 0) {
                console.log(field.name,"has no entry");
                continue;
            }
            if (entries.length > 1) {
                errors.push("More than one entry found");
            }
            entries.length > 0 ? text = entries[0].entry : text = entries;
            form_output[field.name] = {
                text,
                correction_needed : entries.length > 1,
                suggestions : [],
                errors
            }

        }
        console.log("Completed : ", field.name)
        scheduler.terminate();
    }


    // await createFormWithOCRResult(form_id, form_output);
    res.status(200).json(form_output)
    console.log(form_output)
    return form_output
}

// main().then( (form_output) => {
//     console.log(form_output)
// }).catch(error => {
//     console.error('Error:', error);
// });


module.exports = app;