const express = require("express")
const {json} = require("express");
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt")
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

//endpoint for user login, require an user id and the password for that user
router.post("/login", (req,res) => {
    const userPassword = req.body.password;
    const usId = req.body.id;

    pool.connect(function(err, client, done) {
        if (err) {
            console.error('error fetching client from pool', err);
            return res.status(500).json({ error: 'Database connection error' });
        }
        client.query("SELECT password from users where cust_code=$1", [usId], function(err, result) {
            done();
            if (err) {
                console.error('error running query', err);
                return res.status(500).json({ error: 'Query to database failed' });
            }
            if (result.rows.length > 0) {
                const storedHash = result.rows[0].password;
                bcrypt
                    .compare(userPassword, storedHash)
                    .then(result => {
                        if(result){
                            res.send("corrisponde")
                        }
                        else{
                            return res.status(401).json({ error: 'Invalid Password' });
                        }
                    })
                    .catch(err => console.error(err.message))
            }
            else{
                return res.status(404).json({ error: 'User not found' });
            }

        });
    });

})
/*
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
});*/


module.exports = router
