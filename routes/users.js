const express = require("express")
const {json} = require("express");
const bodyParser = require('body-parser');
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


var { Pool } = require('pg');
var conString = "postgres://postgres:studio@localhost/webUsers";

var pool = new Pool({
    connectionString: conString
});

//endpoint to retrieve the password salt of the corresponding user
router.post('/salt', (req, res) => {
    const username = req.body.username;

    pool.connect((err, client, done) => {
        if (err) {
            console.error('Error fetching client from pool', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        client.query('SELECT salt FROM users WHERE username = $1', [username], (err, result) => {
            done();

            if (err) {
                console.error('Error running query', err);
                return res.status(500).json({ error: 'Error running query' });
            }

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ salt: result.rows[0].salt });
            console.log('Salt retrieved:', result.rows[0].salt);
        });
    });
});

// Endpoint per il login dell'utente
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    pool.connect((err, client, done) => {
        if (err) {
            console.error('Error fetching client from pool', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        client.query('SELECT username, password FROM users WHERE username = $1', [username], (err, result) => {
            done();

            if (err) {
                console.error('Error running query', err);
                return res.status(500).json({ error: 'Error running query' });
            }

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (result.rows[0].password === password) {
                // TODO: Gestione del TOKEN
                const token = 'someGeneratedToken';
                res.json({ token });
            } else {
                res.status(401).json({ error: 'Invalid password' });
            }
        });
    });
});


module.exports = router
