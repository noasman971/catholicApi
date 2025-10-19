const express = require("express");
const sql = require("./db");
const router = express.Router();

router.get('/quiz/:tags', async (req, res) => {
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
module.exports = router;