var appPath = process.cwd() + '/app/';

// Dependencies
require(appPath + 'server/models/Summoner.js');

var mongoose = require('mongoose');
var logger = require(appPath + 'server/logger.js');

var Summoner = mongoose.model('Summoner');

var ApiRequester = require('./ApiRequester.js');
var Cache = require('./Cache.js');

var lol = require(appPath + 'config/lol/lol.js');

/**
 * @param {Object} req
 * @param {Object} res 
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