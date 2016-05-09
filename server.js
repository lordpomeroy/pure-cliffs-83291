// server.js

var appPath = process.cwd() + '/app/';

// modules =======================================================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var expressValidator = require('express-validator');
var methodOverride = require('method-override')

// configuration =================================================

// Load needed Models

// config files
var keys = require(appPath + 'config/keys.js');

// set our port
var port = process.env.PORT || 8080;

// connect to our mongoDB database
mongoose.connect(keys.mongoDB);
console.log('Connected to database');

app.use(morgan('dev'));


// get all datat/stuff of the body (POST) parameters
// parse application/json
app.use(bodyParser.json());
app.use(expressValidator());

// parse application/vnd.api+json as json
app.use(bodyParser.json({
  type: 'application/vn.api+json'
}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true
}));

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));

// routes ========================================================

// Load all other routes
require('./app/server/routes')(app);

// start app =====================================================
// startup our app at http://localhost:8080
app.listen(port);

// shoutout to the user
console.log('Magic happens on port ' + port);

// expose app
exports = module.exports = app;