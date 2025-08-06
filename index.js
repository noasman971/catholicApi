const express = require('express')
const app = express()
const port = 3000
const cors = require('cors');
const {error403} = require("./error-403");
const sql = require("./db.js");
require('dotenv').config();

app.use(cors({
    origin: 'http://localhost:8081',
    method: ['*']
}));

app.get('/', async (req, res) => {

    if (error403(req, res)) return;
    try {
        const users = await sql`
            SELECT username
            FROM users
        `;

        return res.send(users);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Erreur serveur');
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
