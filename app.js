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

/*
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use(logger('dev'));
//app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler


app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
*/


app.use("/users", userRouter)

app.listen(3100)


