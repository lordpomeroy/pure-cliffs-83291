var appPath = process.cwd() + '/app/';

// Dependencies
var Cache = require('./Cache.js');

/**
 * Retrieves the summoner from cache.
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
exports.getSummonerByName = function(req, res) {
  'use strict';
  Cache.getSummoner(req.params.summonerName, null, req.params.region, function(error, summoner) {
    if (error) {
      return res.status(404).send(error);
    } else {
      return res.json(summoner);
    }
  });
};