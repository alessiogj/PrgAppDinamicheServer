const express = require('express');
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const userRouter = require("./routes/users")
const {urlencoded, json} = require("body-parser");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Configura CORS
app.use(cors());

// Middleware per parsing del body
app.use(urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/users", userRouter)

app.listen(3100)


