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

// Route to get customer orders
router.get('/getOrders', verifyToken, async (req, res) => {
    if (req.user.userRole !== 'customer') {
        return res.status(401).json({ error: 'User is not a customer' });
    }
    else {
        await poolOrganization.connect(function (err, client, done) {
                if (err) {
                    console.error('error fetching client from pool', err);
                    res.status(500).json({error: 'Database connection error'});
                } else {
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
            }
        )
    }
});

module.exports = router;
