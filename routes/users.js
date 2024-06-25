const express = require("express")
const {json} = require("express");
const bodyParser = require('body-parser');
const router = express.Router();
const saltRounds = 10;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

/*TODO
*  USARE FILE DI CONFIGURAZIONE 
*  PER DATABASE E EVENTUALMENTE POOL CON METODO CARINO
* */
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
        client.query("SELECT cust_code, username, salt from users where username=$1", [username], function(err, result) {
            done();
            if (err) {
                return console.error('error running query', err);
                //a
            }
            res.send(result.rows[0])
        });
    });
})

router.post("/login", (req,res) => {
    const hash = req.body.hash;
    const usId = req.body.id;

    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT password from users where cust_cod=$1", [usId], function(err, result) {
            done();
            if (err) {
                return console.error('error running query', err);
            }
            res.send(result.rows[0])
        });
    });

    bcrypt
        .compare(password, hash)
        .then(res => {
            console.log(res) // return true
        })
        .catch(err => console.error(err.message))

})

/*router.get("/login", (req, res) => {
    //azioni della richiesta
    //connessione a un db
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT salt, username from users where cust_code = 'A007' ", function(err, result) {
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
