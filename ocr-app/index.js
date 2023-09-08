require('dotenv').config();
const PORT = process.env.PORT;
const ocr = require('./ocr/ocr');

(async () => {

  ocr.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

})().catch((err) => console.log(err.stack));



