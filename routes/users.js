const express = require('express');
const { json } = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const saltRounds = 10;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const pool = new Pool({
    connectionString: process.env.WEB_USERS_DB || "postgres://postgres:root@localhost:5433/webUsers"
});

const mainPool = new Pool({
    connectionString: process.env.ORGANIZATION_DB || "postgres://postgres:root@localhost:5433/organization"
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || config.jwtSecretKey);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// Route to verify the token
router.post('/verify-token', (req, res) => {
    const token = req.body.token;
    if (!token) {
        return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY || config.jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: 'Invalid token' });
        }
        return res.status(200).json({ valid: true });
    });
});


// Endpoint for user login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    pool.connect((err, client, done) => {
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
                        const jwtSecretKey = process.env.JWT_SECRET_KEY || config.jwtSecretKey;
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

// Route to get customer orders
router.get('/getCustomerOrders', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'customer') {
        return res.status(401).json({ error: 'User is not a customer' });
    }

    try {
        const client = await mainPool.connect();
        try {
            const result = await client.query(
                "SELECT * FROM orders o JOIN agents a ON o.agent_code = a.agent_code WHERE o.cust_code = $1",
                [req.user.userCode]
            );

            if (result.rows.length > 0) {
                res.json({ orders: result.rows });
            } else {
                res.status(404).json({ error: 'Orders not found for this user' });
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get agent orders
router.get('/getAgentOrders', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }

    try {
        const client = await mainPool.connect();
        try {
            const result = await client.query(
                "SELECT * FROM orders o JOIN customer c ON o.cust_code = c.cust_code WHERE o.agent_code = $1",
                [req.user.userCode]
            );

            if (result.rows.length > 0) {
                res.json({ orders: result.rows });
            } else {
                res.status(404).json({ error: 'Orders not found' });
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to delete an agent order
router.delete('/deleteAgentOrder', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }

    const { order_num } = req.body;

    try {
        const client = await mainPool.connect();
        try {
            const result = await client.query(
                "DELETE FROM orders WHERE ord_num = $1 AND agent_code = $2",
                [order_num, req.user.userCode]
            );

            if (result.rowCount === 1) {
                res.status(200).json('Order deleted successfully');
            } else {
                res.status(404).json({ error: 'Order not found' });
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error running query', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to add an agent order
router.post('/addAgentOrder', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'agent') {
        return res.status(401).json({ error: 'User is not an agent' });
    }

    const newOrder = req.body.order;

    try {
        const client = await mainPool.connect();
        try {
            const result = await client.query(
                "INSERT INTO orders (ord_num, ord_amount, advance_amount, ord_date, cust_code, agent_code, ord_description) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [newOrder.ord_num, newOrder.ord_amount, newOrder.advance_amount, newOrder.ord_date, newOrder.cust_code, newOrder.agent_code, newOrder.ord_description]
            );

            if (result.rowCount === 1) {
                res.status(200).json('Order inserted successfully');
            } else {
                res.status(500).json({ error: 'Failed to insert order' });
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error running query', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
