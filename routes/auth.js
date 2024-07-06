// auth.js - Rotte di autenticazione

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { poolWebUsers, poolOrganization } = require('../db');

const router = express.Router();

// Middleware per il parsing del body delle richieste
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const jwtSecretKeyConfig = config.jwtSecretKey;

/**
 * Endpoint per il login degli utenti
 * @route POST /auth/login
 * @param {Object} req - Oggetto richiesta di Express
 * @param {Object} res - Oggetto risposta di Express
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    poolWebUsers.connect((err, client, done) => {
        if (err) {
            console.error('Errore nel recuperare il client dal pool', err);
            return res.status(500).json({ error: 'Errore di connessione al database' });
        } else {
            client.query("SELECT user_code, password, user_role FROM users WHERE username = $1", [username], (err, result) => {
                done();
                if (err) {
                    console.error('Errore nell\'esecuzione della query', err);
                    return res.status(500).json({ error: 'Errore nella query al database' });
                } else {
                    if (result.rows.length > 0) {
                        const { user_code, password: storedHash, user_role } = result.rows[0];
                        bcrypt.compare(password, storedHash, (err, isMatch) => {
                            if (err) {
                                console.error('Errore di bcrypt:', err);
                                return res.status(500).json({ error: 'Errore nella verifica della password' });
                            } else {
                                if (isMatch) {
                                    const jwtSecretKey = jwtSecretKeyConfig;
                                    const tokenData = {
                                        userCode: user_code,
                                        userRole: user_role,
                                        time: Date.now()
                                    };

                                    const token = jwt.sign(tokenData, jwtSecretKey, { expiresIn: '24h' });

                                    res.status(200).json({ token });
                                } else {
                                    res.status(401).json({ error: 'Password non valida' });
                                }
                            }
                        });
                    } else {
                        res.status(404).json({ error: 'Utente non trovato' });
                    }
                }
            });
        }
    });
});

/**
 * Rotta per verificare il token
 * @route POST /auth/verify-token
 * @param {Object} req - Oggetto richiesta di Express
 * @param {Object} res - Oggetto risposta di Express
 */
router.post('/verify-token', (req, res) => {
    const token = req.body.token;
    if (!token) {
        return res.status(400).json({ valid: false, message: 'Token è richiesto' });
    }

    jwt.verify(token, jwtSecretKeyConfig, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: 'Token non valido' });
        }
        return res.status(200).json({ valid: true });
    });
});

module.exports = router;