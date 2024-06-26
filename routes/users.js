const express = require("express")
const {json} = require("express");
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt")
const config = require('../config');
const jwt = require("jsonwebtoken");
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
    const username = req.body.username;
    const userPassword = req.body.password;


    pool.connect(function(err, client, done) {
        if (err) {
            console.error('error fetching client from pool', err);
            res.status(500).json({ error: 'Database connection error' });
        }
        //recupero della password hashata nel db e del ruolo dell'utente
        client.query("SELECT user_code,password,user_role from users where username=$1", [username], function(err, result) {
            done();
            if (err) {
                console.error('error running query', err);
                res.status(500).json({ error: 'Query to database failed' });
            }
            if (result.rows.length > 0) {
                const storedHash = result.rows[0].password;
                const role = result.rows[0].user_role;
                const usId = result.rows[0].user_code;
                bcrypt
                    .compare(userPassword, storedHash)
                    .then(result => {
                        if(result){
                            //generazione del jwt per richieste future
                            const jwtSecretKey = config.jwtSecretKey;
                            const data = {
                                userCode: usId,
                                userRole: role,
                                time: Date()
                            }

                            const token = jwt.sign(data, jwtSecretKey,{ expiresIn: '24h'});

                            //invio del jwt al client usando un cookie
                            res.cookie('jwtToken', token, {
                                httpOnly: true,
                                secure: false,
                                maxAge: 24 * 60 * 60 * 1000 //Durata  1 giorno
                            })
                            res.status(200).send("Success");

                        }
                        else{
                            res.status(401).json({ error: 'Invalid Password' });
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

router.get("/getorders", (req,res) => {
    const requestingUser = verifyToken(req,res);
    if (Object.keys(requestingUser).length !== 0){

    }
    else{
        return res.status(401).json({ error: 'Unauthorized User' });
    }
})

//mock function to test verify token
router.get("/prova", (req,res) => {
    console.log(verifyToken(req,res))
    if (Object.keys(verifyToken(req,res)).length !== 0){
        res.send("andato");
    }
    else{
        return res.status(401).json({ error: 'Unauthorized User' });
    }
})

//function to verify the incoming jwt
function verifyToken(req,res) {
    const token = req.header('token');
    if (!token) return {};
    try {
        return jwt.verify(token, config.jwtSecretKey);
    } catch (error) {
        return {};
    }
}


module.exports = router
