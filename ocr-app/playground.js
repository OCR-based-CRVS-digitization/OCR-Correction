const { Poppler } = require('node-poppler');
const fs = require('fs');

async function splitPDFtoJPG() {
    const form_id = "ba2d7a3d-f48b-4058-b191-d78a13b09bf6"
    const base_form_path = "../form-images/" + form_id + "/";
    const inputPDF = base_form_path + form_id + '.pdf'; // Replace with your PDF file path
    const jpgImagePath = base_form_path + '/jpg/';
    // mkdir if jpg directory doesnt exit
    if (!fs.existsSync(jpgImagePath)) {
        fs.mkdirSync(jpgImagePath, { recursive: true });
    }

    const outputfilePath = jpgImagePath + 'output'; // Replace with your desired output image path

    const poppler = new Poppler();
    const options = {
        firstPageToConvert: 1,
        lastPageToConvert: 2,
        jpegFile: true,
        resolutionXAxis: 200,
        resolutionYAxis: 200,
    };

    const res = await poppler.pdfToCairo(inputPDF, outputfilePath, options);
    console.log(res);
}

splitPDFtoJPG();