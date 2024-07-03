// config.js

module.exports = {
    jwtSecretKey: "chiavesupersegretapergenerarejwtsicurissimi",
    database: {
        webUsers: {
            user: "postgres",
            host: "localhost",
            database: "webUsers",
            password: "root",
            port: 5433
        },
        organization: {
            user: "postgres",
            host: "localhost",
            database: "organization",
            password: "root",
            port: 5433
        }
    }
};
