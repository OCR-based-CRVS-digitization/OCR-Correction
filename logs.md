-[ ] get suggestions as the user fills up the form ?? 

- [x] find an ocr - [`tesseract.js`]  [`google cloud api`]
    - [x] ocr should be fast
    - [x] ocr detect in a region
    - [x] can be specified number or alphabet
- [ ] find the documentation of `google cloud api`
    - [ ] how to specify region
    - [ ] how to specify number or alphabet
    - [x] can detect bangla
    - [x] very fast
-[x] DHAKA correction DB 
-[x] CHITTAGONG correction DB 


The district does not cover all parts of Greater Dhaka, and Greater Dhaka does not include all parts of the district, which includes rural areas. The district consists of `49 upazilas/thanas`, `86 unions`, 974 mauzas, 1999 villages, `2 City Corporations, 129 City Wards`, 855 City Mahallas, `3 paurashavas`, `27 wards` and 133 mahallas.
    
- [ ] remove OCR_CHAR from the schema to make ocr faster
- [x] checkbox multiple error
- [x] if pdf uploaded, then do pdf to jpg [without quality loss] and get page numbers from the output
- [x] save ocr output to intermediate file
- [ ] remove ocr output file when correction is done TO SAVE SPACE
- [x] do more pdf writing
- [ ] use scanner instead of camscanner
    - [ ] scanner output rotate and translate before sending to ocr 
- [x] do page 2 regions
- [ ] get user feedback

- [x] installed tesseract.js
- [x] installed prisma
- [x] image from firebase -> download -> ocr 




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
    - we need to find a way to get the coordinates of the bounding boxes
    - found a way to manually get coordinates using [this link](https://pixspy.com/)
    

- [ ] the image was retreved locally.
- [ ] get 1.1.jpg from firebase [this link](https://firebasestorage.googleapis.com/v0/b/test-project-c5de2.appspot.com/o/11_01%3A39%3A36-13-08-2023.jpg?alt=media&token=9527160e-59d1-407b-96db-cd71c2c1da1d)
- [ ] get the image link from req.body.url



## field types
The below lines describe the structure of the `fields` in the `crvs-schema.json` file
### OCR WORD 
has name, page number and a regions array with 1 element

### OCR CHAR
has name, page number, index and a regions array with multiple elements

### checkbox
has name, page number, a region array containing all the options. 
Each option has a region, an entry ( the name of the option ) and a brightness value
checkbox only has the correction of multiple entries.


## how checkbox is being verified
we have save the `average brightness` of the checkbox entries. and we calculate the brightness of the input.
if the input brightness is less than the average brightness, then we consider it as `checked` else `unchecked`


# whitelist numbers and strings
set the tesseract ocr to only detect numbers or strings depending on the field. numbers are working, strings are not working yet.

# Scheduler to run the ocr in parallel
failed to make it work

# CORRECTION

### NEEDED TO SPECIFY WHAT KIND OF CORRECTION WE WILL DO
DATE:DAY
DATE:MONTH
DATE:YEAR
EDIT:DIVISION
EDIT:DISTRICT
EDIT:UPAZILLA_THANA -> ACCESSES UPAZILLA AND THANA TABLES,THEN UNION
EDIT:CITYCORPORATION_PAURASHAVA -ACCESSES CITYCORPORATION AND PAURASHAVA TABLES
EDIT:UNION
EDIT:WARDNUMBER -> ACCESSES CITYCORPORATION AND PAURASHAVA TABLES
-EDIT:MOUJA- BAAD
-EDIT:VILLAGE_MOHOLLA- BAAD
EDIT:POST_OFFICE
NONE:




# ERD of correction DB
Division
|
Districts
|
____________________________________________________________________________________________
|               |           |                                 |                            |
Upazilla        Thana       City corporation - ward number    Paurashava - ward number     Post Office - Post code
|
|
union
