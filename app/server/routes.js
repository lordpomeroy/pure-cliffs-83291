var appPath = process.cwd() + '/app/';

// Dependencies
var fs = require('fs');
var path = require('path');
var express = require('express');

module.exports = function(app) {
  'use strict';
  // get an instance of the express Router
  var router = express.Router();

  // traverse the directory and collect all routes
  fs.readdirSync(path.join(appPath, 'server/routes')).forEach(function(routes) {
    if (path.extname(routes) === '.js') {
      console.log('\troutes: ' + routes);
      require(path.join(appPath, 'server/routes', routes))(router);
    }
  });

  // use the prefix '/api' for all API-routes
  app.use('/api', router);
  // show the available routes at server startup
  require(appPath + 'server/showRouting')(router.stack);

  // deploy angular for all routes that do not start with '/api'
  app.get(/^\/(?!api).*/, function(req, res) {
    res.sendfile('./public/system/views/index.html');
  });
  // return 404 if a request to a non-existent API route is performed
  app.all('*', function(req, res) {
    var json = {
      errors: [{
        msg: 'Route is not available ' + req.url + '.'
      }],
      data: null,
      msg: 'ERR_ROUTE_NOT_FOUND'
    };
    res.status(404).send(json);
  });
};