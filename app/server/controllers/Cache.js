var appPath = process.cwd() + '/app/';

// Dependencies
require(appPath + 'server/models/Summoner.js');
require(appPath + 'server/models/Mastery.js');

var mongoose = require('mongoose');
var fs = require('fs');

var Summoner = mongoose.model('Summoner');
var Mastery = mongoose.model('Mastery');

var ApiRequester = require('./ApiRequester.js');
var logger = require(appPath + 'server/logger.js');

// ====================================================================
// Configuration
// ====================================================================
var configDir = appPath + '/config/lol/';
var lol = require(configDir + 'lol.js');
var allowedAge = require(configDir + 'allowedAge.json');
var versionConfig = configDir + 'version.json';
var championDataFile = 'downloads/champion.json';

// ====================================================================
// Cahed Champion Data
// ====================================================================
var championData;

// ====================================================================
// Helper Functions
// ====================================================================

/**
 * Checks if the cache is still valid by comparing the tie since the last update with the sync time.
 * @param  {Date} lastUpdated Date when the cached data was synchronised with the server the last time
 * @param  {Integer} allowed Maximal allowed age in minutes
 * @return {boolean} true if the time since the last update is within the maximal allowed age
 */
var isValid = function(lastUpdated, allowed) {
  'use strict';
  if (lastUpdated !== null && lastUpdated !== undefined) {
    var today = new Date();
    // milliseconds between now & last update
    var diffMs = (today - new Date(lastUpdated));
    // hours between now & last update
    var diffMin = Math.round(diffMs / 60000);
    return diffMin < allowed;
  }
  return false;
};

/**
 * Load the champion data currently stored in the champion.json
 */
var loadChampionData = function() {
  'use strict';
  logger.log('Load champion data', 'info', 'lol/controllers/Cache - loadChampionData');
  try {
    var data = fs.readFileSync(championDataFile);
    var parsedData = JSON.parse(data);
    return {
      err: null,
      data: parsedData
    };
  } catch (err) {
    // If the champion data was never downloaded set data.lastUpdated to null = 'infinity'.
    if (err.code === 'ENOENT') {
      return {
        err: null,
        data: {
          lastUpdated: null
        }
      };
    }
    // In all other cases throw an error
    return {
      err: [{
        msg: "The champion data is currently not available."
      }],
      data: null
    };
  }
};

// ====================================================================
// Loop to update the summoners regulary
// ====================================================================
var updateArray = [];

var updateSummoner = function() {
  'use strict';
  if (updateArray.length === 0) {
    Summoner.find().select('summonerId region').exec(function(err, summoners) {
      if (err) {
        logger.log('An error occured during database request', 'error', 'lol/controllers/Cache - updateSummoner', err);
      }
      for (var i = 0; i < summoners.length; i++) {
        updateArray.push({
          summonerId: summoners[i].summonerId,
          region: summoners[i].region
        });
      }
      logger.log('Updated summoner list from database', 'background', 'lol/controllers/Cache - updateSummoner', updateArray);
      updateSummoner();
    });
  } else {
    var summoner = updateArray.shift();
    ApiRequester.getCurrentGame(summoner.summonerId, summoner.region, function(err, currentGame) {
      if (err) {
        if (err !== 404) {
          logger.log('An error occured during getting the current game', 'error', 'lol/controllers/Cache - updateSummoner', err);
        }
        exports.getSummoner(null, summoner.summonerId, summoner.region, function(err, summoner) {
          updateSummoner();
        });
      } else {
        var addCurrentParticipants = function(participants) {
          if (participants.length !== 0) {
            var participant = participants.pop();
            Summoner.find({
              $and: [{
                'summonerId': participant.summonerId
              }, {
                'region': summoner.region
              }]
            }, function(err, foundSummoner) {
              if (!err && !foundSummoner) {
                updateArray.push({
                  summonerId: participant.summonerId,
                  region: summoner.region
                });
              }
              addCurrentParticipants(participants);
            });
          } else {
            logger.log('Updated summoner list from current game', 'background', 'lol/controllers/Cache - updateSummoner', updateArray);
            exports.getSummoner(null, summoner.summonerId, summoner.region, function(err, summoner) {
              updateSummoner();
            });
          }
        };
        addCurrentParticipants(currentGame.participants);
      }
    });
  }
};
//updateSummoner();

// ====================================================================
// Main Functions
// ====================================================================

// ====================================================================
// Summoner
// ====================================================================

/**
 * Takes a summonerName or summonerId and retrives the corresponding summoner data from cache. Queues a new Request to the League of Legends API if the cached data is too old.
 * @param  {String} summonerName  The summonerName according to the League of Legends API to request.
 * @param  {Integer} summonerId   The summonerId according to the League of Legends API to request.
 * @param  {String} region        The region to query.
 * @param  {Function} callback    Callback to be executed when the operation finishes. Takes an error Object and the summoner data.
 */
exports.getSummoner = function(summonerName, summonerId, region, callback) {
  'use strict';
  logger.log('Parameters', 'info', 'lol/controllers/Cache - getSummoner', {
    summonerName: summonerName,
    summonerId: summonerId,
    region: region
  });
  if (summonerName === undefined && summonerId === undefined) {
    return callback([{
      msg: "The champion data is currently not available."
    }], null);
  }

  /**
   * Updated or requests the given summoner depending. If the summoner is valid it returns the cached data. Otherwise the summoner is updated via an API request.
   * @param  {Object} summoner Summoner object to update/request. Only contains the region and name in case of a new request.
   * @param  {Boolean} valid   Flag if the local summoner data is valid or not
   * @return {cuntion()}       callback function after the request to the API
   */
  var requestSummoner = function(summoner, valid) {
    /**
     * Takes the summoner data and processes it.
     * @param  {Object} err  Error Object given from ApiRequester during request
     * @param  {Object} data Summoner data as JSON
     */
    var processSummonerData = function(err, data) {
      if (err) {
        return callback(err, null);
      } else if (data === undefined || data === null) {
        return callback([{
          msg: "An error occured during processing the champion data."
        }], null);
      } else {
        // Set the values for level, profileIcon, revisionDate and summonerName
        summoner.level = data.summonerLevel;
        summoner.profileIcon = data.profileIconId;
        summoner.revisionDate = data.revisionDate;
        summoner.summonerName = data.name;
        // Set update date
        var lastUpdated = summoner.updated;
        if (!valid) {
          summoner.updated = new Date();
        }
        // on first fetch set the summonerId and soloQueue / teams to empty arrays
        if (summoner.summonerId === undefined || summoner.summonerId === null) {
          summoner.summonerId = data.id;
        }
        logger.log('New summoner data', 'info', 'lol/controllers/Cache - getSummoner', summoner);
        summoner.save(function(err) {
          if (err) {
            return callback(err, summoner);
          }
          // Get the corresponding champion masteries
          ApiRequester.getMasteryBySummoner(summoner, function(err, masteries) {
            if (err) {
              return callback(err, summoner);
            }
            if (!summoner.masteries) {
              summoner.masteries = [];
            }
            /**
             * Processes the given mastery array. Takes the first entr in the array and dalls itself recursively.
             * @param  {Object} masteries The array of masteries to process
             * @return {function()}       function including an error object and the final summoner object
             */
            var processMastery = function(masteries) {
              // If the array is empty finish the recursion
              if (masteries.length !== 0) {
                // Create a mastery object
                var mastery = new Mastery(masteries.pop());
                // Skip the mastery if it hasnt changed since the last update
                if (mastery.lastPlayTime.getTime() < lastUpdated.getTime()) {
                  processMastery(masteries);
                } else {
                  // remove the connection between the summoner and the old mastery
                  for (var i = 0; i < summoner.masteries.length; i++) {
                    if (summoner.masteries[i].championId === mastery.championId) {
                      summoner.masteries.splice(i, 1);
                      break;
                    }
                  }
                  // remove the old mastery
                  Mastery.findOneAndRemove({
                    playerId: mastery.playerId,
                    championId: mastery.championId
                  }, {}, function(err, deleted) {
                    // save the new mastery
                    mastery.save(function(err) {
                      if (err) {
                        return callback(err, summoner);
                      }
                      // Add the new mastery to the summoner
                      summoner.masteries.push(mastery);
                      processMastery(masteries);
                    });
                  });
                }
              } else {
                // save, populate and return the summoner
                summoner.save(function(err, summoner) {
                  if (err) {
                    return callback(err, summoner);
                  }
                  Summoner.populate(summoner, {
                    path: 'masteries'
                  }, function(err, summoner) {
                    if (err) {
                      return callback(err, summoner);
                    }
                    return callback(null, summoner);
                  });
                });
              }
            };
            processMastery(masteries);
          });
        });
      }
    };
    if (valid) {
      logger.log('Using Cached values', 'info', 'lol/controllers/Cache - getSummoner', summoner);
      return callback(null, summoner);
    } else {
      // If the summoner is not valid query it again
      if (summoner.summonerName === undefined) {
        ApiRequester.getSummonerById(summoner.summonerId, summoner.region, processSummonerData);
      } else {
        ApiRequester.getSummonerByName(summoner.summonerName, summoner.region, processSummonerData);
      }
    }
  };

  // Set the options depending on search for summonerName or summonerId
  var options;
  if (summonerName) {
    options = {
      $and: [{
        'summonerName': summonerName
      }, {
        'region': region
      }]
    };
  } else {
    options = {
      $and: [{
        'summonerId': summonerId
      }, {
        'region': region
      }]
    };
  }

  // Retrieve the given summoner from the database
  Summoner.findOne(options).populate('masteries').exec(function(err, summoner) {
    if (err) {
      logger.log('There has been an error accessing the Summoner.', 'info', 'lol/controllers/Cache - getSummoner', err);
      return {
        err: [{
          msg: "The summoner data is currently not available."
        }],
        data: null
      };
    }
    // Devide if the saved date is valid
    var valid = false;
    if (summoner !== null) {
      valid = isValid(summoner.updated, allowedAge.summoner);
    } else {
      summoner = new Summoner();
      if (summonerName) {
        summoner.summonerName = summonerName;
      }
      if (summonerId) {
        summoner.summonerId = summonerId;
      }
      summoner.region = region;
    }
    // Update or request the summoner
    requestSummoner(summoner, valid);
  });
};

// ====================================================================
// Champion
// ====================================================================

/**
 * Retrieves the champion data from cache. Queues a new Request to the League of Legends API if the cached data is too old.
 * @param  {Function} callback   Callback to be executed when the operation finishes. Takes an error Object an the champion data.
 */
exports.getChampions = function(callback) {
  'use strict';
  // Check the javascript object, then load from file
  if (!championData) {
    var load = loadChampionData();
    if (load.err !== null) {
      return callback([{
        msg: load.err
      }], null);
    }
    championData = load.data;
  }

  // If the data is valid return it
  if (isValid(championData.lastUpdated, allowedAge.championData)) {
    return callback(null, championData.championData.data);
  } else {
    // Query a new request and return the old data for fast user expierience
    ApiRequester.getChampionData(null, function(err, data) {
      // Replace the stored data
      championData = data;
    });
    return callback(null, championData.championData.data);
  }
};