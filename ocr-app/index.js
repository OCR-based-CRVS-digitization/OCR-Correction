require('dotenv').config();
const PORT = process.env.PORT;
const app = require('./app');

(async () => {

  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

})().catch((err) => console.log(err.stack));


