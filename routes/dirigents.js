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
 * Rotta per ottenere i clienti disponibili per l'agente
 * @route GET /getAvailableCustomers
 * @param {Object} req - Oggetto richiesta di Express
 * @param {Object} res - Oggetto risposta di Express
 */
router.get('/getAvailableCustomers', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'L\'utente non è un agente' });
    } else {
        await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('Errore nel recuperare il client dal pool', err);
                res.status(500).json({ error: 'Errore di connessione al database' });
            } else {
                client.query("SELECT cust_code FROM customer", function (err, result) {
                    done();
                    if (err) {
                        console.error('Errore nell\'esecuzione della query', err);
                        res.status(500).json({ error: 'Errore nella query al database' });
                    } else {
                        res.json({ customers: result.rows });
                    }
                });
            }
        });
    }
});

/**
 * Rotta per ottenere tutti gli ordini per un dirigente
 * @route GET /getOrders
 * @param {Object} req - Oggetto richiesta di Express
 * @param {Object} res - Oggetto risposta di Express
 */
router.get('/getOrders', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'dirigent') {
        return res.status(401).json({ error: 'L\'utente non è un dirigente' });
    } else {
        await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('Errore nel recuperare il client dal pool', err);
                res.status(500).json({ error: 'Errore di connessione al database' });
            } else {
                client.query(
                    `SELECT o.*, c.cust_code as cust_custcode, c.cust_name, c.cust_city, c.working_area as cust_workingarea, 
                     c.cust_country as cust_country, c.grade, c.opening_amt, c.receive_amt, c.payment_amt, 
                     c.outstanding_amt, c.phone_no as cust_phoneno, c.agent_code as cust_agentcode, 
                     a.agent_code as agent_agentcode, a.agent_name, a.working_area as agent_workingarea, 
                     a.commission, a.phone_no as agent_phoneno, a.country as agent_country 
                     FROM orders o 
                     JOIN customer c ON o.cust_code = c.cust_code 
                     JOIN agents a ON o.agent_code = a.agent_code`,
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

/**
 * Rotta per modificare un ordine
 * @route PUT /modifyOrder
 * @param {Object} req - Oggetto richiesta di Express
 * @param {Object} res - Oggetto risposta di Express
 */
router.put('/modifyOrder', verifyToken, async (req, res) => {
    const updatedOrder = req.body.modifiedOrder;
    if (req.user.userRole !== 'dirigent') {
        return res.status(401).json({ error: 'L\'utente non è un dirigente' });
    } else {
        await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('Errore nel recuperare il client dal pool', err);
                res.status(500).json({ error: 'Errore di connessione al database' });
            }
            client.query(
                `UPDATE orders 
                 SET ord_num = $1, ord_amount = $2, advance_amount = $3, ord_date = $4, cust_code = $5, 
                 agent_code = $6, ord_description = $7 
                 WHERE ord_num = $1;`,
                [
                    updatedOrder.ord_num, updatedOrder.ord_amount, updatedOrder.advance_amount,
                    updatedOrder.ord_date, updatedOrder.cust_code, updatedOrder.agent_code,
                    updatedOrder.ord_description
                ],
                function (err, result) {
                    done();
                    if (err) {
                        console.error('Errore nell\'esecuzione della query', err);
                        res.status(500).json({ error: 'Errore nella query al database' });
                    } else {
                        if (result.rowCount > 0) {
                            res.status(200).json("Ordine modificato con successo");
                        } else {
                            return res.status(404).json({ error: 'Ordine non trovato' });
                        }
                    }
                }
            );
        });
    }
});

module.exports = router;
