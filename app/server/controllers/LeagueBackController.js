var appPath = process.cwd() + '/app/';

// Dependencies
require(appPath + 'packages/lol/models/League.js');

var mongoose = require('mongoose');
var League = mongoose.model('League');

/**
 * Find league from the database and add it to the request object.
 * @param {Object} req
 * @param {Object} res
 */
exports.getOne = function(req, res, next, leagueId) {
  'use strict';
  League.findOne({
    _id : leagueId
  }).exec(function(err, league) {
    if (league === undefined || league === null || err) {
      return res.status(404).send([{
        msg : 'League does not exist.'
      }]);
    } else {
      req.league = league;
      next();
    }
  });
};

/**
 * Show the league inside of the request.
 * @param {Object} req
 * @param {Object} res
 */
exports.show = function(req, res) {
  'use strict';
  return res.json(req.league);
};