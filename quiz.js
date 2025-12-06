const express = require("express");
const sql = require("./db");
const router = express.Router();

router.get('/:tags', async (req, res) => {
    console.log("DATA : " , req.params);
    try {
        const quiz = await sql`
            SELECT
                quiz.*,
                COUNT(question.id) AS nb_questions
            FROM quiz
                     LEFT JOIN question ON question.id_quiz = quiz.id
            WHERE quiz.tag = ${req.params.tags}
            GROUP BY quiz.id;
        `;
        return res.status(200).json(quiz);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message:'Erreur serveur.'});
    }
})

router.post('/', async (req, res) => {
    console.log("DATA : " , req.body);

    if (!req.body || req.body.name.length === 0 || req.body.tags.length === 0) {
        return res.status(403).json({ message: 'Données manquantes.' });
    }
    try {
        await sql`
            INSERT INTO quiz (name, tag, created_by)
            VALUES (${req.body.name}, ${req.body.tags}, ${req.body.userId});
        `;
        return  res.status(201).json({ message: 'Nouveau quiz créé avec succès.' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message:'Erreur serveur.'});
    }
})
router.get('/', async (req, res) => {
    try {
        const quiz = await sql`
            SELECT
                q.*,
                u.username        AS user_username,
                COALESCE(qc.nb_questions, 0) AS nb_questions
            FROM quiz q
                     LEFT JOIN "users" u ON u.id = q.created_by
                     LEFT JOIN (
                SELECT id_quiz, COUNT(*) AS nb_questions
                FROM question
                GROUP BY id_quiz
            ) qc ON qc.id_quiz = q.id;
        `;
        return res.status(200).json(quiz);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message:'Erreur serveur.'});
    }

});

router.delete(':id', async (req, res) => {
    console.log("DATA : " , req.params);
    try {
        await sql`
            DELETE FROM quiz
            WHERE id = ${req.params.id};
        `;
        return res.status(200).json({ message: 'Quiz supprimé avec succès.' });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message:'Erreur serveur.'});
    }
})
module.exports = router;