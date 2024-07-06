const express = require('express');
const userRouter = require("./routes/customers");
const agentRouter = require("./routes/agents");
const dirigentRouter = require("./routes/dirigents");
const authRouter = require("./routes/auth");
const { urlencoded, json } = require("body-parser");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Configura CORS
app.use(cors());

// Middleware per il parsing del body delle richieste
app.use(urlencoded({ extended: true }));
app.use(bodyParser.json());

// Monta i router
app.use("/customers", userRouter);
app.use("/agents", agentRouter);
app.use("/dirigents", dirigentRouter);
app.use("/auth", authRouter);

// Avvia il server
app.listen(3100);