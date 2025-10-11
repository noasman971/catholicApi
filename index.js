const express = require('express')
const bcrypt = require('bcrypt');
const app = express()
const port = 3000
const cors = require('cors');
const {error403} = require("./error-403");
const sql = require("./db.js");
const jwt = require('jsonwebtoken');

require('dotenv').config();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:8081',
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    exposedHeaders: [],

}));
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'self';"
    );
    if (error403(req, res)) return;

    next();
});

/**
 * Vérifier la sécurité encore avec zap mais en local pour éviter les commit inutil
 */


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.get('/', async (req, res) => {

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


app.post('/register', async (req, res) => {
    console.log("DATA:", req.body);
    /**
     * Règles de validation :
     * - username : obligatoire, entre 3 et 20 caractères, alphanumérique
     * - password : obligatoire, au moins 8 caractères, au moins une majuscule, une minuscule, un chiffre
     * - email : obligatoire, format email valide et non vide ou déjà utilisé
     *
     *  - Aucun espace dans les champs
     *  - password == confirmPassword et hashé
     */
    if (req.body.username.length < 3 || req.body.username.length > 20) {
        return res.status(400).json({ message:'Le nom d’utilisateur doit contenir entre 3 et 20 caractères.'});
    }
    if (!/^[a-zA-Z0-9]+$/.test(req.body.username)) {
        return res.status(400).json({ message:'Le nom d’utilisateur ne doit contenir que des caractères alphanumériques ni d espaces.'});
    }

    if (/\s/.test(req.body.username) || /\s/.test(req.body.password) || /\s/.test(req.body.email)) {
        return res.status(400).json({ message:'Les champs ne doivent pas contenir d’espaces ou être vide.'});
    }


    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).json({ message:'Le format de l’adresse email est invalide.'});
    }
    // Vérifier si l’email est déjà utilisé
    const existingUser = await sql`
        SELECT email
        FROM users
        WHERE email = ${req.body.email}
    `;
    const existingUsername = await sql`
        SELECT username
        FROM users
        WHERE username = ${req.body.username}
    `;

    if (existingUsername.length > 0) {
        return res.status(400).json({ message:'Le nom d’utilisateur est déjà utilisé.'});
    }

    if (existingUser.length > 0) {
        return res.status(400).json({ message:'L’adresse email est déjà utilisée.'});
    }

    if (req.body.password.length < 8) {
        return res.status(400).json({ message:'Le mot de passe doit contenir au moins 8 caractères.'});
    }
    if (!/[a-z]/.test(req.body.password) || !/[A-Z]/.test(req.body.password) || !/[0-9]/.test(req.body.password)) {
        return res.status(400).json({ message:'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.'});
    }
    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message:'Les mots de passe ne correspondent pas.'});
    }
    if (!req.body.agree)
    {
        return res.status(400).json({ message:'Vous devez accepter les conditions d’utilisation.'});
    }

    const saltRounds = 10;
    const hashPassword = async (plainPassword) => {
        try {
            const salt = await bcrypt.genSalt(saltRounds);
            const hashedPassword = await bcrypt.hash(plainPassword, salt);
            return hashedPassword;
        } catch (error) {
            console.error('Erreur lors du hachage du mot de passe :', error);
            throw error;
        }
    };
    const hashed = await hashPassword(req.body.password);
    try {
        await sql`
            INSERT INTO users (username, password, email)
            VALUES (${req.body.username}, ${hashed}, ${req.body.email})
        `;
        return res.status(201).json({ message:'Utilisateur créé avec succès.'});
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message:'Erreur serveur.'});
    }




})

app.post('/login', async (req, res) => {
    console.log("DATA:", req.body);
    /**
     * Règles de validation :
     * - password : correct
     * - email : existant
     *
     *  - Aucun espace dans les champs
     */


    if (/\s/.test(req.body.password) || /\s/.test(req.body.email)) {
        return res.status(400).json({ message:'Les champs ne doivent pas contenir d’espaces ou être vide.'});
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).json({ message:'Le format de l’adresse email est invalide.'});
    }

    // Vérifier si l’email existe
    const existingUser = await sql`
        SELECT *
        FROM users
        WHERE email = ${req.body.email}
    `;
    console.log(existingUser);

    if (existingUser.length === 0) {
        return res.status(400).json({ message:"L’adresse email n'existe pas."});
    }

    const checkPassword = bcrypt.compareSync(req.body.password, existingUser[0].password );
    console.log(checkPassword);
    if (!checkPassword) {
        return res.status(400).json({ message:'Le mot de passe est incorrect.'});
    }
    jwt.sign({id: existingUser[0].id,username: existingUser[0].username, email: existingUser[0].email}, process.env.JWT_SECRET, { expiresIn: '365d' }, (err, token) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message:'Erreur serveur.'});
        }
        return res.status(200).json({ message:'Connexion réussie.', jwt: token});
    });


})

app.post('/verify-token', (req, res) => {
    const token = req.body.token;
    console.log("Verifying token:", req.body);
    if (!token) {
        return res.status(400).json({ message: 'Token manquant.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error(err);
            return res.status(401).json({ message: 'Token invalide ou expiré.' });
        }
        return res.status(200).json({ message: 'Token valide.', user: decoded });
    });
})