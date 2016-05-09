var appPath = process.cwd() + '/app/';

// Dependencies
require(appPath + 'server/models/Mastery.js');
require(appPath + 'server/models/Summoner.js');

var mongoose = require('mongoose');
var logger = require(appPath + 'server/logger.js');

var configDir = appPath + '/config/lol/';
var allowedAge = require(configDir + 'allowedAge.json');

var Mastery = mongoose.model('Mastery');
var Summoner = mongoose.model('Summoner');

var euw = {
  summonerCount: -1,
  champions: {},
  updated: null
};

var na = {
  summonerCount: -1,
  champions: {},
  updated: null
};

/**
 * @param {Object} req
 * @param {Object} res 
 */
exports.getRegionStatistic = function(req, res) {
  'use strict';
  var data;
  if (req.params.region === 'EUW' || req.params.region === 'NA') {
    if (req.params.region === 'EUW') {
      data = euw;
    } else {
      data = na;
    }
    var today = new Date();
    // milliseconds between now & last update
    var diffMs = (today - data.updated);
    // hours between now & last update
    var diffMin = Math.round(diffMs / 60000);
    if (diffMin > allowedAge.statistic) {
      Summoner.find({
        region: req.params.region
      }).populate('masteries').exec(function(err, summoners) {
        data.summonerCount = summoners.length;
        data.updated = new Date();
        var champions = {};
        var i, j;
        for (i = 0; i < summoners.length; i++) {
          for (j = 0; j < summoners[i].masteries.length; j++) {
            if (champions[summoners[i].masteries[j].championId] === undefined) {
              champions[summoners[i].masteries[j].championId] = {
                totalPlayers: 0,
                totalChampionPoints: 0,
                players: []
              };
            }
            champions[summoners[i].masteries[j].championId].players.push({
              summonerName: summoners[i].summonerName,
              championPoints: summoners[i].masteries[j].championPoints
            });
            champions[summoners[i].masteries[j].championId].totalPlayers++;
            champions[summoners[i].masteries[j].championId].totalChampionPoints += summoners[i].masteries[j].championPoints;
          }
        }
        data.champions = champions;
        if (req.params.region === 'EUW') {
          euw = data;
        } else {
          na = data;
        }
        return res.status(200).send(data);
      });
    } else {
      if (req.params.region === 'EUW') {
        data = euw;
      } else {
        data = na;
      }
      return res.status(200).send(data);
    }
  } else {
    return res.status(404).send([{
      msg: 'Statistics for the region ' + req.params.region + ' are not implemented currently'
    }]);
  }
};