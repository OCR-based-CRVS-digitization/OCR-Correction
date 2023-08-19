const axios = require('axios');
const tesseract = require('tesseract.js');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const correction = require('./correction/correction')
const express = require('express');
const prisma = new PrismaClient();


const region_file = '../schema/crvs-schema.json';
const base_image_path = "../form-images/";

app=express();
app.use(express.json());
app.post("/",main)


var divisions = getDivision();


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


async function getDistricts(division_id) {
    try{
            const districts = await prisma.district.findMany({
            where: {
                division_id: division_id
            }
        });
        return districts; 
    }
    catch (error) {
        console.error('Error:', error);
    }   
}

async function getDivision() {
    try{
        const divisions = await prisma.division.findMany();
        console.log(divisions)
        return divisions;
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


const perform_ocr = async (imagePath, data_type, region) => {
    const worker = await tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    if (data_type == 'NUMBER') {
        await worker.setParameters({
            tessedit_char_whitelist: correction.whitelist_numbers
        });
    } else if (data_type == 'STRING ') {
        await worker.setParameters({
            tessedit_char_whitelist: correction.whitelist_characters
        });
    }
    
    const { data: { text } } = await worker.recognize(imagePath, {
        rectangle: { left: region[0], top: region[1], width: region[2], height: region[3] },
    });
    await worker.terminate();
    return text.trimEnd();
};


const ocr_letter_by_letter = async(imagePath, data_type, regions) => {
    let text = ""
    for ( let regionInfo of regions) {
        char = await perform_ocr(imagePath, data_type, regionInfo.region)
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
    //get info from request
    //initialization
    var form_output = {}
    // get image info from firebase

    var form_id = req.body.form_id;
    //each form has 4 pages
    //we can get the url and page number from firebase's db
    let imagePaths = []
    imagePaths.push({
        url : req.body.url,
        page_number : 1
    })
    
    console.log("Form ID : ", form_id)
    console.log("Image URL : ", imagePaths[0].url)

    //download the image locally
    for (let imagePath of imagePaths) {
        await downloadImage(imagePath.url, base_image_path + form_id + "/jpg/", form_id + "." + imagePath.page_number + ".jpg")
    }

    // read json data from region.csv
    var data = fs.readFileSync(region_file, 'utf8');
    var fields = JSON.parse(data)

    // iterate through the fields 
    for (let field of fields) {
        var imagePath = base_image_path + form_id + "/jpg/" + form_id + "." + field.page_number + ".jpg";
        
        //TODO figure out if you tell ocr that this is a number
        // only for first page of the form
        if (field.type == 'OCR_WORD') {
            let region = field.regions[0].region;
            let data_type = field.data_type;
            let text = await perform_ocr(imagePath, data_type, region);
            form_output[field.name] = text;
        } else if (field.type == "OCR_CHAR") {
            let data_type = field.data_type;
            let text = await ocr_letter_by_letter(imagePath, data_type, field.regions);
            form_output[field.name] = text;
        } else if (field.type == "CHECKBOX") {
            let entries = await get_checkbox_input(imagePath, field.regions)
            if (entries.length == 0) {
                console.log(field.name,"has no entry");
                continue;
            }
            if (entries.length == 1) {
                form_output[field.name] = entries[0].entry
                continue;
            }
            // there are multiple checkboxes detected
            form_output[field.name] = []
            for (let entry of entries) {
                form_output[field.name].push(entry.entry)
            }
        }
        console.log("Completed : ", field.name)
    }


    //////////////////////////
    // get division and district
    const divisions = await getDivision();
    for(let division of divisions) {
        console.log(division.name)
        const districts = await getDistricts(division.id);
        division.districts = districts;
        for(let district of districts) {
            console.log("\t",district.name)
        }
    }

    // await createFormWithOCRResult(form_id, form_output);
    res.status(200).json({message : "kaj korse mama"})
    return form_output
}

main().then( (form_output) => {
    console.log(form_output)
}).catch(error => {
    console.error('Error:', error);
});


module.exports = app;