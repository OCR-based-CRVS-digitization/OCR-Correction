# What it does
This part of the code will be used to parse the pdf and send the fields to ocr.

# Requirements
 - nodejs
 - python3
 - tesseract

# python libraries installed
 - Pillow `pip install Pillow`

# How to use it
We could not find an OCR API (yet) so we had to improvise
 - Install tesseract [here](https://github.com/UB-Mannheim/tesseract/wiki)
 - install the dependencies `npm install`
 - run `python field_creator.py` to create a json file with all the field informtion
 - run the code `node index.js`
 - a port will open at `localhost:5074`
 - if you send a post request to `localhost:5074/` with a form id and image url in the body, it will return the ocr outputs of the form fields to the database.
