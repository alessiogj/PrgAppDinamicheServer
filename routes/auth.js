const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { poolWebUsers, poolOrganization } = require('../db');

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const jwtSecretKeyConfig = config.jwtSecretKey;

// Endpoint for user login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    poolWebUsers.connect((err, client, done) => {
        if (err) {
            console.error('Error fetching client from pool', err);
            return res.status(500).json({ error: 'Database connection error' });
        }
        else{
            client.query("SELECT user_code, password, user_role FROM users WHERE username = $1", [username], (err, result) => {
                done();
                if (err) {
                    console.error('Error running query', err);
                    return res.status(500).json({ error: 'Query to database failed' });
                }
                else{
                    if (result.rows.length > 0) {
                        const { user_code, password: storedHash, user_role } = result.rows[0];
                        bcrypt.compare(password, storedHash, (err, isMatch) => {
                            if (err) {
                                console.error('Bcrypt error:', err);
                                return res.status(500).json({ error: 'Error verifying password' });
                            }
                            else {
                                if (isMatch) {
                                    const jwtSecretKey = jwtSecretKeyConfig;
                                    const tokenData = {
                                        userCode: user_code,
                                        userRole: user_role,
                                        time: Date.now()
                                    };

                                    const token = jwt.sign(tokenData, jwtSecretKey, {expiresIn: '24h'});

                                    res.status(200).json({token});
                                } else {
                                    res.status(401).json({error: 'Invalid password'});
                                }
                            }
                        });
                    }
                    else {
                        res.status(404).json({ error: 'User not found' });
                    }
                }
            });
        }
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

module.exports = router;