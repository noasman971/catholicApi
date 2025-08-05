const express = require('express')
const app = express()
const port = 3000
const cors = require('cors');
const {error403} = require("./error-403");
require('dotenv').config();

app.use(cors({
    origin: 'http://localhost:8081',
    method: ['*']
}));

app.get('/', (req, res) => {

    error403(req, res)

    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
