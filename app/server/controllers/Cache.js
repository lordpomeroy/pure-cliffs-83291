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
// Config
// ====================================================================
var configDir = appPath + '/config/lol/';
var lol = require(configDir + 'lol.js');
var allowedAge = require(configDir + 'allowedAge.json');
var versionConfig = configDir + 'version.json';
var championDataFile = 'downloads/champion.json';

// ====================================================================
// Cahed CHampion Data
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
 * Takes a summonerName and retrives the corresponding summoner data from cache. Queues a new Request to the League of Legends API if the cached data is too old.
 * @param  {Integer} summonerName The summonerName according to the League of Legends API to request.
 * @param  {String} region        The region to query.
 * @param  {Function} callback    Callback to be executed when the operation finishes. Takes an error Object an the summoner data.
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

  var requestSummoner = function(summoner, valid) {
    /**
     * Takes the summoner data and processes it.
     * @param  {Object} err  Error Object given from ApiRequester during sync operation
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
        summoner.level = data.summonerLevel;
        summoner.profileIcon = data.profileIconId;
        summoner.revisionDate = data.revisionDate;
        summoner.summonerName = data.name;
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
          ApiRequester.getMasteryBySummoner(summoner, function(err, masteries) {
            if (err) {
              return callback(err, summoner);
            }
            if (!summoner.masteries) {
              summoner.masteries = [];
            }
            var processMastery = function(masteries) {
              if (masteries.length !== 0) {
                var mastery = new Mastery(masteries.pop());
                //if (mastery.lastPlayTime.getTime() < lastUpdated.getTime()) {
                //  console.log('Skipped mastery ' + mastery.lastPlayTime.getTime() + ' : ' + lastUpdated.getTime());
                //  processMastery(masteries);
                //} else {
                  for (var i = 0; i < summoner.masteries.length; i++) {
                    if (summoner.masteries[i].championId === mastery.championId) {
                      summoner.masteries.splice(i, 1);
                      break;
                    }
                  }
                  Mastery.findOneAndRemove({
                    playerId: mastery.playerId,
                    championId: mastery.championId
                  }, {}, function(err, deleted) {
                    mastery.save(function(err) {
                      if (err) {
                        return callback(err, summoner);
                      }
                      summoner.masteries.push(mastery);
                      processMastery(masteries);
                    });
                  });
                //}
              } else {
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
      //logger.log('Using Cached values', 'info', 'lol/controllers/Cache - getSummoner', summoner);
      return callback(null, summoner);
    } else {
      if (summoner.summonerName === undefined) {
        ApiRequester.getSummonerById(summoner.summonerId, summoner.region, processSummonerData);
      } else {
        ApiRequester.getSummonerByName(summoner.summonerName, summoner.region, processSummonerData);
      }
    }
  };

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

  Summoner.findOne(options).populate('masteries').exec(function(err, summoner) {
    if (err) {
      console.log('There has been an error accessing the Summoner.');
      console.log(err);
      return {
        err: [{
          msg: "The summoner data is currently not available."
        }],
        data: null
      };
    }
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
    requestSummoner(summoner, valid);
  });
};

// ====================================================================
// Champion
// ====================================================================

/**
 * Retrives the champion data from cache. Queues a new Request to the League of Legends API if the cached data is too old.
 * @param  {Integer} championKey The championKey according to the League of Legends API to request.
 * @param  {Function} callback   Callback to be executed when the operation finishes. Takes an error Object an the champion data.
 */
exports.getChampions = function(callback) {
  'use strict';
  if (!championData) {
    var load = loadChampionData();
    if (load.err !== null) {
      return callback([{
        msg: load.err
      }], null);
    }
    championData = load.data;
  }

  /**
   * Takes the champion data and finds the data for the searched id. Calls callback with the champion or an error if no champion is found.
   * @param  {Object} err            Error Object given from ApiRequester during sync operation
   * @param  {Object[]} championData Champion data Array
   */
  var processChampionData = function(err, championData) {
    if (err) {
      return callback(err, null);
    }
    return callback(null, championData.championData.data);
  };

  if (isValid(championData.lastUpdated, allowedAge.championData)) {
    processChampionData(null, championData);
  } else {
    ApiRequester.getChampionData(function() {});
    processChampionData(null, championData);
  }
};