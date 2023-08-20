
- [x] find an ocr - [`tesseract.js`]  [`google cloud api`]
    - [x] ocr should be fast
    - [x] ocr detect in a region
    - [x] can be specified number or alphabet
- [ ] find the documentation of `google cloud api`
    - [ ] how to specify region
    - [ ] how to specify number or alphabet
    - [x] can detect bangla
    - [x] very fast


- [ ] checkbox multiple error
- [ ] if pdf uploaded, then do pdf to jpg [without quality loss] and get page numbers from the output 
- [ ] do more pdf writing
- [ ] use scanner instead of camscanner
    - [ ] scanner output rotate and translate before sending to ocr 
- [ ] do page 2 regions
- [ ] get 4 pages and 4 links for the images from database
- [ ] get user feedback

- [x] installed tesseract.js
- [x] installed prisma
- [x] image from firebase -> download -> ocr
- [ ] 




apparently tesseract.js has bengali trained data too. to access it
```
await worker.loadLanguage('ben');
await worker.initialize('ben');
``` 

apparently there are online tools where we can draw bounding boxes and get the coordinates
we can export those coordinates as we like. chatgpt had this to say
```
Choose an Image Annotation Tool: There are several image annotation tools available online that allow you to draw bounding boxes on an image. Some popular options include Labelbox, RectLabel, VGG Image Annotator (VIA), and many more. Choose one that suits your requirements and is easy to use.
```

 - the previous coordinates don't work perfectly idk why
    - we need to find a way to get the coordinates of the bounding boxes
    - found a way to manually get coordinates using [this link](https://pixspy.com/)
    

- [ ] the image was retreved locally.
now we can get 1.1.jpg from [this link](https://firebasestorage.googleapis.com/v0/b/test-project-c5de2.appspot.com/o/11_01%3A39%3A36-13-08-2023.jpg?alt=media&token=9527160e-59d1-407b-96db-cd71c2c1da1d)



## field types
The below lines describe the structure of the `fields` in the `crvs-schema.json` file
### OCR WORD 
has name, page number and a regions array with 1 element

### OCR CHAR
has name, page number, index and a regions array with multiple elements

### checkbox
has name, page number, a region array containing all the options. 
Each option has a region, an entry ( the name of the option ) and a brightness value


## how checkbox is being verified
we have save the `average brightness` of the checkbox entries. and we calculate the brightness of the input.
if the input brightness is less than the average brightness, then we consider it as `checked` else `unchecked`


# whitelist numbers and strings
set the tesseract ocr to only detect numbers or strings depending on the field. numbers are working, strings are not working yet.

# Scheduler to run the ocr in parallel

### NEEDED TO SPECIFY WHAT KIND OF CORRECTION WE WILL DO
DATE:DAY
DATE:MONTH
DATE:YEAR
EDIT:DISTRICT
NONE: