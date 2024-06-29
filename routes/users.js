const express = require('express');
const { json } = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const jwtSecretKeyConfig = config.jwtSecretKey;
const dbConfig = config.database;

const poolWebUsers = new Pool(dbConfig.webUsers);
const poolOrganization = new Pool(dbConfig.organization);

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

// Endpoint for user login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    poolWebUsers.connect((err, client, done) => {
        if (err) {
            console.error('Error fetching client from pool', err);
            return res.status(500).json({ error: 'Database connection error' });
        }

        client.query("SELECT user_code, password, user_role FROM users WHERE username = $1", [username], (err, result) => {
            done();
            if (err) {
                console.error('Error running query', err);
                return res.status(500).json({ error: 'Query to database failed' });
            }

            if (result.rows.length > 0) {
                const { user_code, password: storedHash, user_role } = result.rows[0];

                bcrypt.compare(password, storedHash, (err, isMatch) => {
                    if (err) {
                        console.error('Bcrypt error:', err);
                        return res.status(500).json({ error: 'Error verifying password' });
                    }

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
                        res.status(401).json({ error: 'Invalid password' });
                    }
                });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        });
    });
});

// Route to verify the token
router.post('/verify-token', (req, res) => {
    const token = req.body.token;
    if (!token) {
        return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    jwt.verify(token, jwtSecretKeyConfig, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: 'Invalid token' });
        }
        return res.status(200).json({ valid: true });
    });
});

// Route to get customer orders
router.get('/getCustomerOrders', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'customer') {
        return res.status(401).json({ error: 'User is not a customer' });
    }

    await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('error fetching client from pool', err);
                res.status(500).json({error: 'Database connection error'});
            }
            //recupero degli ordini dell'utente
            client.query("SELECT * FROM orders o JOIN agents a ON o.agent_code = a.agent_code WHERE o.cust_code = $1",
                [req.user.userCode],
                function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    }
                    res.json({orders: result.rows});
                });
        }
    )});

// Route to get agent orders
router.get('/getAgentOrders', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }

    await poolOrganization.connect(function (err, client, done) {
            if (err) {
                console.error('error fetching client from pool', err);
                res.status(500).json({error: 'Database connection error'});
            }
            //recupero degli ordini dell'utente
            client.query("SELECT * FROM orders o JOIN customer c ON o.cust_code = c.cust_code WHERE o.agent_code = $1",
                [req.user.userCode],
                function (err, result) {
                    done();
                    if (err) {
                        console.error('error running query', err);
                        res.status(500).json({error: 'Query to database failed'});
                    }
                    res.json({orders: result.rows});

                });
        }
    )});

router.put('/modifyAgentOrder', verifyToken, async (req,res) => {
    const updatedOrder = req.body.modifiedOrder;
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }
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
                }
                if (result.rowCount > 0) {
                    res.status(200).json("order modified successfully")
                } else {
                    return res.status(404).json({error: 'User not found'});
                }
            });
    });
})

// Route to delete an agent order
router.delete('/deleteAgentOrder', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }
    await poolOrganization.connect(function (err, client, done) {
        if (err) {
            console.error('error fetching client from pool', err);
            res.status(500).json({error: 'Database connection error'});
        }
        client.query("DELETE FROM orders WHERE ord_num = $1;",
            [req.body.ord_num],
            function (err, result) {
                done();
                if (err) {
                    console.error('error running query', err);
                    res.status(500).json({error: 'Query to database failed'});
                } else if (result.rowCount > 0) {
                    res.status(200).json({message: "Order deleted successfully"});
                } else {
                    res.status(404).json({error: 'Order not found'});
                }
            });
    });
});

// Route to add an agent order
router.post('/addAgentOrder', verifyToken, async (req, res) => {
    const newOrder = req.body.newOrder;
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }

    await poolOrganization.connect(function (err, client, done) {
        if (err) {
            console.error('error fetching client from pool', err);
            res.status(500).json({error: 'Database connection error'});
        }
        client.query("INSERT INTO orders (ord_num, ord_amount, advance_amount, ord_date, cust_code, agent_code, ord_description) VALUES ($1, $2, $3, $4, $5, $6, $7);",
            [newOrder.ord_num, newOrder.ord_amount, newOrder.advance_amount, newOrder.ord_date, newOrder.cust_code, newOrder.agent_code, newOrder.ord_description],
            function (err, result) {
                done();
                if (err) {
                    console.error('error running query', err);
                    res.status(500).json({error: 'Query to database failed'});
                } else {
                    res.status(200).json({message: "Order added successfully"});
                }
            });
    });
});

module.exports = router;
