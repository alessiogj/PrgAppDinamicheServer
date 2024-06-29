// config.js

module.exports = {
    jwtSecretKey: "chiavesupersegretapergenerarejwtsicurissimi",
    database: {
        webUsers: {
            user: "postgres",
            host: "localhost",
            database: "webUsers",
            password: "studio",
            port: 5432
        },
        organization: {
            user: "postgres",
            host: "localhost",
            database: "organization",
            password: "studio",
            port: 5432
        }
    }
};
