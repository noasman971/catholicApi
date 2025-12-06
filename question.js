const express = require("express");
const sql = require("./db");
const router = express.Router();

router.post('/', async (req, res) => {
    console.log("DATA : " , req.body);

    //refaire le check
    if (!req.body || !req.body.id_quiz || !req.body.text || !req.body.options || req.body.choices.length < 2) {
        return res.status(403).json({ message: 'Données manquantes.' });
    }

    try {
        await sql`
            INSERT INTO question (question, id_quiz, type, options)
            VALUES (${req.body.question}, ${req.body.id_quiz}, ${req.body.type}, ${req.body.options});
        `;
        return  res.status(201).json({ message: 'Nouvelle question créée avec succès.' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message:'Erreur serveur.'});
    }

});


module.exports = router;