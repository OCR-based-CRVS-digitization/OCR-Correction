const axios = require('axios');
const path = require('path');
const correction = require('../correction/correction')
const { createWorker, createScheduler } = require('tesseract.js');
const Jimp = require('jimp');
const { Poppler } = require('node-poppler');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');



app=express();
app.use(express.json());
app.post("/",main)


const crvs_schema_file = '../schema/crvs-schema.json';
const base_file_path = "../form-images/";
const base_ocr_output_path = "ocr/ocr_output/";


const createDirectories = () => {
    if (!fs.existsSync(base_ocr_output_path)) {
        fs.mkdirSync(base_ocr_output_path, { recursive: true });
    }
    if (!fs.existsSync(base_file_path)) {
        fs.mkdirSync(base_file_path, { recursive: true });
    }
}


const downloadFile = async(url, folderPath, filename, extension) => {
    try{
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
        });

        if (response.status === 200) {
            filename += "." + extension;
            console.log("filename after extension " + filename);

            const fullPath = path.join(folderPath, filename);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            response.data.pipe(fs.createWriteStream(fullPath));

            // Wait for the file to finish downloading
            await new Promise((resolve, reject) => {
                response.data.on('end', () => resolve());
                response.data.on('error', (err) => reject(err));
            });

            console.log(`File downloaded and saved as ${fullPath}`);
        } else {
        console.error(`Failed to download file. HTTP status code: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error downloading file: ${error.message}`);
    }
}

async function splitPDFtoJPG(inputPDFPath, outputImagePath) {
    
    // mkdir if jpg directory doesnt exit
    if (!fs.existsSync(outputImagePath)) {
        fs.mkdirSync(outputImagePath, { recursive: true });
    }

    const outputfilePath = outputImagePath + 'output'; // Replace with your desired output image path

    const poppler = new Poppler();
    const options = {
        firstPageToConvert: 1,
        lastPageToConvert: 2,
        jpegFile: true,
        resolutionXAxis: 200,
        resolutionYAxis: 200,
    };

    const res = await poppler.pdfToCairo(inputPDFPath, outputfilePath, options);
    console.log(res);
}

const getExtension = (filename) => {
    var parts = filename.split('.');
    return parts[parts.length - 1];
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

async function createFormWithOCRResult(form_id, ocr_result, workspace_id, eiin) {
    try{
        const form = await prisma.form_ocr_output.create({
            data: {
                form_id: form_id,
                ocr_result: ocr_result,
                eiin : eiin,
                workspace_id : workspace_id,
            },
        });
        return form;
    }
    catch (error) {
        console.error('Error:', error);
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
            entries.push(regionInfo.entry)
        }
    }
    // console.log(entries)
    return entries
}




async function main(req,res) {
    createDirectories();
    var ocr_output = []
    const scheduler = createScheduler();

    // //todo each form has 4 pages
    // //todo we can get the url and page number from firebase's db
    var form_id = req.body.form_id;
    var file_url = req.body.url;
    var workspace_id = req.body.workspace_id;
    var eiin = req.body.eiin;

    // console.log("url splitting")
    // console.log(file_url.split('/')[7].split('?')[0]);
    let extension = getExtension(file_url.split('/')[7].split('?')[0]);
    extension = 'pdf'; //! fix later
    let downloadPath = base_file_path + form_id + "/";
    await downloadFile(file_url, downloadPath, form_id, extension).then(() => {
        console.log("Downloaded file. splitting pdf into image");
        splitPDFtoJPG(downloadPath + form_id + "." + extension, downloadPath + "jpg/");
        }).catch((error) => {
            console.log("Error downloading file")
            console.log(error)
        });
    


    // read json data from crvs-schema.json
    var data = fs.readFileSync(crvs_schema_file, 'utf8');
    var fields = JSON.parse(data)

    for (let field of fields) {
        var imagePath = base_file_path + form_id + "/jpg/output-" + field.page_number + ".jpg";
        console.log("Processing : ", field.name);

        if (field.type == 'OCR_WORD') {
            let region = field.regions[0].region;
            let ocr_text = await perform_ocr(imagePath, field.data_type, region, scheduler);
            ocr_output.push({
                name : field.name,
                field_type : field.type,
                data_type : field.data_type,
                text : ocr_text,
                correction : field.correction
            });

        } else if (field.type == "OCR_CHAR") {

            let ocr_text = await ocr_letter_by_letter(imagePath, field.data_type, field.regions, scheduler);
            ocr_output.push({
                name : field.name,
                field_type : field.type,
                data_type : field.data_type,
                text : ocr_text,
                correction : field.correction
            });


        } else if (field.type == "CHECKBOX") {
            let entries = await get_checkbox_input(imagePath, field.regions)
            ocr_output.push({
                name : field.name,
                field_type : field.type,
                data_type : field.data_type,
                text : entries,
                correction : field.correction
            });
        }
        console.log("Completed : ", field.name)
        scheduler.terminate();
    }

    // console.log(ocr_output)
    // // save the ocr_output as json
    const ocr_result = JSON.stringify(ocr_output, null, 2);
    const ocr_result_file_name = base_ocr_output_path + 'ocr_'+ form_id + '.json';
    fs.writeFileSync(ocr_result_file_name, ocr_result);
    console.log("Saved ocr result as json")

    
    //call the correction module
    console.log("Calling correction module")
    let form_output = await correction.correct(ocr_result_file_name);
    res.status(200).json(form_output)
    // console.log(form_output)
    await createFormWithOCRResult(form_id, form_output, workspace_id, eiin);
    console.log("Completed : ", form_id)
    return;
}


module.exports = app;