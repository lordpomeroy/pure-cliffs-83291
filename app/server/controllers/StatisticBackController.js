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

// Storage for the statistics for EUW and NA
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
 * Retrieves the statistical data.
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
exports.getRegionStatistic = function(req, res) {
  'use strict';
  var data;
  // Check if the region has been implemented
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
    // check the maximum difference, recalculate if the data is too old. Always return the last calculated data as this operation takes a long time.
    if (diffMin > allowedAge.statistic) {
      // Recalculate the statistics, this may take a while
      Summoner.find({
        region: req.params.region
      }).populate('masteries').exec(function(err, summoners) {
        console.log('Data found');
        data.summonerCount = summoners.length;
        data.updated = new Date();
        var champions = {};
        var i, j;
        // Process all summoners
        for (i = 0; i < summoners.length; i++) {
          console.log(i / summoners.length);
          // Process each summoners masteries
          for (j = 0; j < summoners[i].masteries.length; j++) {
            // Create the champion entry in the array if it is not already there
            if (champions[summoners[i].masteries[j].championId] === undefined) {
              champions[summoners[i].masteries[j].championId] = {
                totalPlayers: 0,
                totalChampionPoints: 0,
                players: []
              };
            }
            // Add the summoner to th eplayer object
            champions[summoners[i].masteries[j].championId].players.push({
              summonerName: summoners[i].summonerName,
              championPoints: summoners[i].masteries[j].championPoints
            });
            // Add the player and the champion points to the totals
            champions[summoners[i].masteries[j].championId].totalPlayers++;
            champions[summoners[i].masteries[j].championId].totalChampionPoints += summoners[i].masteries[j].championPoints;
          }
        }
        // Store the data
        data.champions = champions;
        if (req.params.region === 'EUW') {
          euw = data;
        } else {
          na = data;
        }
      });
    }
    // Retrieve the data and send it
    if (req.params.region === 'EUW') {
      data = euw;
    } else {
      data = na;
    }
    return res.status(200).send(data);
  } else {
    // Return an error if the region is not implemented
    return res.status(404).send([{
      msg: 'Statistics for the region ' + req.params.region + ' are not implemented currently'
    }]);
  }
};