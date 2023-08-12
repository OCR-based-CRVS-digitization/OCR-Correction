const axios = require('axios');
const tesseract = require('tesseract.js');
const Jimp = require('jimp');
const fs = require('fs');

const region_file = '../schema/crvs-schema.json'
const base_image_path = "../form-images/"
var pdf_id = '1';

async function calculate_average_brightness(imagePath, left, top, width, height) {
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


const perform_ocr = async (imagePath, region) => {
    const worker = await tesseract.createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(imagePath, {
        rectangle: { left: region[0], top: region[1], width: region[2], height: region[3] },
    });
    await worker.terminate();
    return text.trimEnd();
};


const ocr_letter_by_letter = async(imagePath, regions) => {
    let text = ""
    for ( let regionInfo of regions) {
        char = await perform_ocr(imagePath, regionInfo.region)
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
        // console.log("entry : ", regionInfo.entry)
        // console.log("Average brightness : ", averageBrightness)
        // console.log("Region brightness : ", regionInfo.brightness, "\n")
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




async function main() {
    // read json data from region.csv
    var data = fs.readFileSync(region_file, 'utf8');
    var fields = JSON.parse(data)
    var form_output = {}
    // iterate through the fields 
    for (let field of fields) {
        var imagePath = base_image_path + pdf_id + "/jpg/" + pdf_id + "." + field.page_number + ".jpg";
        if (field.type == 'OCR_WORD' && field.page_number == '1') {
            let region = field.regions[0].region

            let text = await perform_ocr(imagePath, region);
            form_output[field.name] = text
        } else if (field.type == "OCR_CHAR") {
            let text = await ocr_letter_by_letter(imagePath, field.regions);
            form_output[field.name] = text
        } else if (field.type == "CHECKBOX") {
            let entries = await get_checkbox_input(imagePath, field.regions)
            // console.log(entries)
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
    return form_output
}


main().then( (form_output) => {
    console.log(form_output)
}).catch(error => {
    console.error('Error:', error);
});


