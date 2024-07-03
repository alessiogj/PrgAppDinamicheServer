const express = require('express');
const userRouter = require("./routes/customers")
const agentRouter = require("./routes/agents")
const dirigentRouter = require("./routes/dirigents")
const authRouter = require("./routes/auth")
const {urlencoded, json} = require("body-parser");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Configura CORS
app.use(cors());

// Middleware per parsing del body
app.use(urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/customers", userRouter)
app.use("/agents", agentRouter)
app.use("/dirigents", dirigentRouter)
app.use("/auth", authRouter)

app.listen(3100)


