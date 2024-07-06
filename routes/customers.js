const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { poolWebUsers, poolOrganization } = require('../db');

const router = express.Router();

// Middleware per il parsing del corpo delle richieste
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const jwtSecretKeyConfig = config.jwtSecretKey;

/**
 * Middleware per verificare il token JWT
 * @param {Object} req - Oggetto richiesta di Express
 * @param {Object} res - Oggetto risposta di Express
 * @param {Function} next - Funzione middleware successiva di Express
 */
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Accesso negato. Nessun token fornito.' });
    }
    try {
        req.user = jwt.verify(token, jwtSecretKeyConfig);
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token non valido.' });
    }
};

/**
 * Rotta per ottenere gli ordini del cliente
 * @route GET /customers/getOrders
 * @param {Object} req - Oggetto richiesta di Express
 * @param {Object} res - Oggetto risposta di Express
 */
router.get('/getOrders', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'customer') {
        return res.status(401).json({ error: 'L\'utente non è un cliente' });
    } else {
        await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('Errore nel recuperare il client dal pool', err);
                res.status(500).json({ error: 'Errore di connessione al database' });
            } else {
                // Recupero degli ordini per il cliente
                client.query(
                    "SELECT * FROM orders o JOIN agents a ON o.agent_code = a.agent_code WHERE o.cust_code = $1",
                    [req.user.userCode],
                    function (err, result) {
                        done();
                        if (err) {
                            console.error('Errore nell\'esecuzione della query', err);
                            res.status(500).json({ error: 'Errore nella query al database' });
                        } else {
                            res.json({ orders: result.rows });
                        }
                    }
                );
            }
        });
    }
});

module.exports = router;
