- [ ] install axios, make a request from chatgpt like hello world

- installed npm-tesseract-ocr
- installed tesseract.js

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