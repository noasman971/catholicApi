export function error403(req, res) {
    if (req.headers['api-key'] !== process.env.API_KEY) {
        return res.status(403).send(`
            <html lang="fr">
              <head><title>Accès refusé</title></head>
              <body style="font-family:sans-serif;text-align:center;padding-top:50px;">
                <h1>403 - Accès refusé</h1>
                <p>Tu n’as pas le droit d’être ici 🛑</p>
              </body>
            </html>
        `);
        return true;
    }
    return false;
}