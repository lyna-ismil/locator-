var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');
require('dotenv').config();

// --- Route Imports ---
// This imports the routes from your routes/stations.js file
var stationRouter = require('./routes/stations');

var app = express();

// --- Database Connection ---
// Updated to use the specific environment variable for this service
mongoose.connect(process.env.MONGO_URI_STATION)
.then(() => console.log('Station Service - MongoDB connected successfully.'))
.catch(err => console.error('MongoDB connection error:', err));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// --- Middleware Setup ---
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
// This sets up the base path for all station-related API calls
app.use('/api/v1/stations', stationRouter);

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

module.exports = app;
