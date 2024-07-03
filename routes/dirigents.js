const express = require('express');
const bodyParser = require('body-parser');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { poolWebUsers, poolOrganization } = require('../db');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const jwtSecretKeyConfig = config.jwtSecretKey;

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        req.user = jwt.verify(token, jwtSecretKeyConfig);
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

router.get('/getAvailableCustomers', verifyToken, async (req,res) => {
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }
    else {
        await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('error fetching client from pool', err);
                res.status(500).json({error: 'Database connection error'});
            } else {
                client.query("select cust_code from customer", function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    } else {
                        res.json({customers: result.rows});
                    }
                });
            }
        });
    }

})

router.get('/getOrders', verifyToken, async (req,res) => {
    if (req.user.userRole !== 'dirigent') {
        return res.status(401).json({ error: 'User is not a dirigent' });
    }
    else {
        await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('error fetching client from pool', err);
                res.status(500).json({error: 'Database connection error'});
            } else {
                client.query("select o.*, c.cust_code as cust_custcode, c.cust_name, c.cust_city, c.working_area as cust_workingarea, c.cust_country as cust_country, c.grade, c.opening_amt, c.receive_amt, c.payment_amt, c.outstanding_amt, c.phone_no as cust_phoneno, c.agent_code as cust_agentcode, a.agent_code as agent_agentcode, a.agent_name, a.working_area as agent_workingarea, a.commission, a.phone_no as agent_phoneno, a.country as agent_country from orders o join customer c on o.cust_code = c.cust_code join agents a on o.agent_code = a.agent_code", function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    } else {
                        res.json({orders: result.rows});
                    }
                });
            }
        });
    }
})

router.put('/modifyOrder', verifyToken, async (req,res) => {
    const updatedOrder = req.body.modifiedOrder;
    if (req.user.userRole !== 'dirigent') {
        return res.status(401).json({ error: 'User is not a dirigent' });
    }
    else {
        await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('error fetching client from pool', err);
                res.status(500).json({error: 'Database connection error'});
            }
            client.query("UPDATE orders SET ord_num = $1, ord_amount = $2, advance_amount = $3, ord_date = $4, cust_code = $5, agent_code = $6, ord_description = $7 WHERE ord_num = $1;",
                [updatedOrder.ord_num, updatedOrder.ord_amount, updatedOrder.advance_amount, updatedOrder.ord_date, updatedOrder.cust_code, updatedOrder.agent_code, updatedOrder.ord_description],
                function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    } else {
                        if (result.rowCount > 0) {
                            res.status(200).json("order modified successfully")
                        } else {
                            return res.status(404).json({error: 'Order not found'});
                        }
                    }
                });
        });
    }
})

module.exports = router;
