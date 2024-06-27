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
var conString = "postgres://postgres:root@localhost:5433/webUsers";

var pool = new Pool({
    connectionString: conString
});

var{ MainPool } = require('pg');
var mainConString = "postgres://postgres:root@localhost:5433/organization"

var mainPool = new Pool({
    connectionString: mainConString
});

//endpoint for user login, require a user id and the password for that user
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
                            res.status(200).json("Success");

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

router.get("/getCustomer", (req,res) => {
    if(true){
        manageCustomer(req, res);
    }
    else if (true && true){
        manageAgent(req, res);
    }
    else{
        //diregiente
    }
})

function manageCustomer(){

}

function manageAgent(){

}

//return for the customer who make the request the corresponding orders with the agent responsible for the orders
router.get("/getCustomerOrders", (req,res) => {
    const requestingUser = verifyToken(req,res);
    if (Object.keys(requestingUser).length !== 0){
        const userCode = requestingUser.userCode;
        if(requestingUser.userRole !== "customer"){
            res.status(401).json({error: "User is not a customer"})
        }
        else {
            mainPool.connect(function (err, client, done) {
                if (err) {
                    console.error('error fetching client from pool', err);
                    res.status(500).json({error: 'Database connection error'});
                }
                //recupero degli ordini dell'utente
                client.query("SELECT * from orders o join agents a on o.agent_code = a.agent_code where o.cust_code=$1", [userCode], function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    }
                    if (result.rows.length > 0) {
                        console.log(result)
                        res.json({orders: result.rows})
                    } else {
                        return res.status(404).json({error: 'User not found'});
                    }
                });
            });
        }
    }
    else{
        return res.status(401).json({ error: 'Unauthorized User' });
    }
})

//return for the agent who make the request the corresponding orders for whose is responsible with the customer of the order
router.get("/getAgentOrders", (req,res) => {
    const requestingUser = verifyToken(req,res);
    if (Object.keys(requestingUser).length !== 0){
        const userCode = requestingUser.userCode;
        console.log(userCode)
        if(requestingUser.userRole !== "agent"){
            res.status(401).json({error: "User is not an agent"})
        }
        else {
            mainPool.connect(function (err, client, done) {
                if (err) {
                    console.error('error fetching client from pool', err);
                    res.status(500).json({error: 'Database connection error'});
                }
                //recupero degli ordini dell'utente
                client.query("SELECT * from orders o join customer c on o.cust_code = c.cust_code where o.agent_code=$1", [userCode], function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    }
                    if (result.rows.length > 0) {
                        console.log(result)
                        res.json({orders: result.rows})
                    } else {
                        return res.status(404).json({error: 'User not found'});
                    }
                });
            });
        }
    }
    else{
        return res.status(401).json({ error: 'Unauthorized User' });
    }
})

//TODO CAPIRE COME STRUTTURARE LA MODIFICA
router.put("/modifyAgentOrder", (req,res) => {

})

//delete an order held by the agent, use order id to delete the record
router.delete("/deleteAgentOrder", (req,res) => {
    const order_num = req.body.order_num;
    const requestingUser = verifyToken(req,res);
    if (Object.keys(requestingUser).length !== 0){
        const userCode = requestingUser.userCode;
        if(requestingUser.userRole !== "agent"){
            res.status(401).json({error: "User is not an agent"})
        }
        else {
            mainPool.connect(function (err, client, done) {
                if (err) {
                    console.error('error fetching client from pool', err);
                    res.status(500).json({error: 'Database connection error'});
                }
                //recupero degli ordini dell'utente
                client.query("delete from orders where ord_num=$1 and agent_code=$2", [order_num, userCode], function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    }
                    if (result.rowCount === 1 && result.command === "DELETE"){
                        res.status(200).json("Order deleted successfully")
                    }
                    else{
                        res.status(404).json({error: 'Order not found'});
                    }
                    console.log(result);
                    /*else {
                        return res.status(200).json({error: 'Order deleted successfully'});
                    }*/
                });
            });
        }
    }
    else{
        return res.status(401).json({ error: 'Unauthorized User' });
    }
})

router.post("/addAgentOrder", (req,res) => {
    const newOrder = req.body.order;
    const requestingUser = verifyToken(req,res);
    if (Object.keys(requestingUser).length !== 0){
        const userCode = requestingUser.userCode;
        if(requestingUser.userRole !== "agent"){
            res.status(401).json({error: "User is not an agent"})
        }
        else {
            mainPool.connect(function (err, client, done) {
                if (err) {
                    console.error('error fetching client from pool', err);
                    res.status(500).json({error: 'Database connection error'});
                }
                //recupero degli ordini dell'utente
                client.query("insert into orders (ord_num, ord_amount, advance_amount, ord_date, cust_code, agent_code, ord_description) values ($1,$2,$3,$4,$5,$6,$7)", [newOrder.ord_num, newOrder.ord_amount, newOrder.advance_amount, newOrder.ord_date, newOrder.cust_code, newOrder.agent_code, newOrder.ord_description], function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    }
                    console.log(result)
                    if (result.rowCount === 1 && result.command === "INSERT"){
                        res.status(200).json("Order inserted successfully")
                    }
                    else{
                        //TODO CAPIRE CHE CODICE METTERE
                        res.status(404).json({error: 'Order not found'});
                    }
                    console.log(result);
                });
            });
        }
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
