const express = require("express");
const sql = require("./db");
const {QuestionTypes} = require("./Enums");
const router = express.Router();


//TODO: rajouter une verif que une answer doit correspondre a une option (dans le cas ou on modifie une option on demande de re sélectionner  l'answer)
router.post('/', async (req, res) => {
    console.log("DATA : " , req.body);

    if (req.type !== QuestionTypes.SCALE &&  (!req.body.id_quiz || req.body.question.length ===0 || req.body.options.length < 2 ||
        req.body.answer.length ===0 )) {
        return res.status(403).json({ message: 'Données manquantes.' });
    }
    for (const option of req.body.options) {
        if (option.length === 0) {
            return res.status(403).json({ message: 'Toutes les options doivent être renseignées.' });
        }
    }

    try {
        const question = await sql`
            INSERT INTO question (question, id_quiz, type, options)
            VALUES (${req.body.question}, ${req.body.id_quiz}, ${req.body.type}, ${req.body.options})
            RETURNING id;
        `;
        const questionId = question[0].id;
        await sql`
            INSERT INTO answers (id_question, answer)
            VALUES (${questionId}, ${req.body.answer});
        `;
        return  res.status(201).json({ message: 'Nouvelle question créée avec succès.' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message:'Erreur serveur.'});
    }

});


module.exports = router;