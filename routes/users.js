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
router.post("/salt", (req,res) => {

    const username = req.body.username;

    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT cust_code, username, salt from users where username= $1", [username], function(err, result) {
            done();
            if (err) {
                return console.error('error running query', err);
                //a
            }
            res.send(result.rows[0])
        });
    });
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
                return console.error('error running query', err);
            }
            res.send(result)
        });
    });
})*/


module.exports = router
