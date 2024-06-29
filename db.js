// db.js
const { Pool } = require('pg');
const config = require('./config');

const dbConfig = config.database;

const poolWebUsers = new Pool({
    user: dbConfig.webUsers.user,
    host: dbConfig.webUsers.host,
    database: dbConfig.webUsers.database,
    password: dbConfig.webUsers.password,
    port: dbConfig.webUsers.port,
});

const poolOrganization = new Pool({
    user: dbConfig.organization.user,
    host: dbConfig.organization.host,
    database: dbConfig.organization.database,
    password: dbConfig.organization.password,
    port: dbConfig.organization.port,
});

module.exports = {
    poolWebUsers,
    poolOrganization,
};
