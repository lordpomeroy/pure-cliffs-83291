var appPath = process.cwd() + '/app/';

// Dependencies
var request = require('request');
var fs = require('fs');
var colors = require('colors/safe');
var logger = require(appPath + 'server/logger.js');

// ====================================================================
// Config
// ====================================================================
var keys = require(appPath + 'config/keys.js');
var lol = require(appPath + 'config/lol/lol.js');
var versionConfig = appPath + 'config/lol/version.json';
var championData = 'downloads/champion.json';

// ====================================================================
// Variables
// ====================================================================
var priorityRequets = [];
var normalRequests = [];

// ====================================================================
// Helper Functions
// ====================================================================

/**
 * Adds the given request to the list of requests to be executed.
 * @param  {string}   url      Url to request.
 * @param  {boolean}  priority Flag to indicate if the request is important and thus must be executed as fast as possible.
 * @param  {Function} callback Callback to be executed after the request.
 */
var apiRequest = function(url, priority, callback) {
  'use strict';
  // Add the request to the queue
  if (priority) {
    priorityRequets.push({
      url: url,
      callback: callback
    });
  } else {
    normalRequests.push({
      url: url,
      callback: callback
    });
  }
  // Choose the next request to send. High priority request are done first.
  var requestUrl;
  if (priorityRequets.length > 0) {
    requestUrl = priorityRequets.shift().url;
  } else {
    requestUrl = normalRequests.shift().url;
  }
  // Send the request
  request.get(requestUrl, function(err, response, body) {
    if (err !== null) {
      logger.log(err.message, 'error', 'lol/controllers/ApiRequester - apiRequest');
      callback([{
        msg: err.message
      }], body);
    } else {
      var status;
      if (response.statusCode >= 200 && response.statusCode < 400) {
        status = colors.green(response.statusCode);
      } else {
        status = colors.red(response.statusCode);
      }
      logger.log(requestUrl + ' ' + status, 'apiRequest', 'lol/controllers/ApiRequester - apiRequest', body);
      // Decide on action based on the response
      if (response.statusCode === 404) {
        callback(404, body);
      } else if (response.statusCode === 429) {
        // retry if we recieved an 429, set timeout by recieved header
        setTimeout(apiRequest, response.headers['retry-after'] * 1000, url, priority, callback);
      } else if (response.statusCode === 500) {
        // retry if we recieved an 500, set timeout to 5 min
        setTimeout(apiRequest, 5 * 60 * 1000, url, priority, callback);
      } else {
        // return the retrieved data
        callback(null, body);
      }
    }
  });
};

// ====================================================================
// Main Functions
// ====================================================================

/**
 * Checks the config file for the current version and sends an update request if the version is older then 24 h.
 * @param {function()} callback - callback function to execute after the request
 */
exports.getStaticDataVersion = function(callback) {
  'use strict';
  var config = null;

  try {
    var data = fs.readFileSync(versionConfig);
    config = JSON.parse(data);
  } catch (err) {
    logger.log('There has been an error parsing your JSON.', 'error', 'lol/controllers/ApiRequester - getStaticDataVersion', err);
  }

  var diffHrs = 0;

  if (config !== null) {
    var today = new Date();
    // milliseconds between now & last update
    var diffMs = (today - new Date(config.lastUpdated));
    // hours between now & last update
    diffHrs = Math.round(diffMs / 1440000);
  }

  if (config === null || diffHrs > 24) {
    // Request the new version
    request.get(lol.apiStatic + 'v1.2/versions?api_key=' + keys.apiKey, function(error, response, body) {
      if (error !== null) {
        callback(null, error);
      } else {
        // Store the data
        var data = JSON.parse(body);
        var version = data[0];
        var config = {
          version: version,
          lastUpdated: new Date()
        };

        // Save the data to a file
        fs.writeFile(versionConfig, JSON.stringify(config), function(err) {
          if (err) {
            logger.log('There has been an error saving your configuration data.', 'error', 'lol/controllers/ApiRequester - getStaticDataVersion', err);
            callback(null, err);
          } else {
            callback(config.version, null);
          }
        });
      }
    });
  } else {
    logger.log('Use saved data dragon version.', 'info', 'lol/controllers/ApiRequester - getStaticDataVersion');
    callback(config.version, null);
  }
};

/**
 * Download the current champion data from the data dragon and store it locally.
 * @param {function()} callback -  callback function to execute after the request
 */
exports.getChampionData = function(callback) {
  'use strict';
  // Get the current data dragon version
  exports.getStaticDataVersion(function(version) {
    // Send a request to get the data
    request.get(lol.dataDragonBase + version + lol.dataDragonUSData + 'champion.json', function(error, response, body) {
      if (error !== null) {
        callback(null, error);
      } else {
        var data = {
          championData: JSON.parse(body),
          lastUpdated: new Date()
        };
        // Store tha data locally
        fs.writeFile(championData, JSON.stringify(data), function(err) {
          if (err) {
            logger.log('There has been an error saving your champion data.', 'error', 'lol/controllers/ApiRequester - getStaticDataVersion', err);
            callback(err, data);
          } else {
            callback(null, data);
          }
        });
      }
    });
  });
};

// ====================================================================
// Functions to check a summoner and the champion masteries
// ====================================================================

/**
 * Takes a summonerName and retrives the corresponding summoner data from the League of Legends API-
 * @param  {String} summonerName  The summonerName according to the League of Legends API to request.
 * @param  {String} region        The region to query.
 * @param  {function()} callback    Callback to be executed when the operation finishes. Takes an error Object and the summoner data.
 */
exports.getSummonerByName = function(summonerName, region, callback) {
  'use strict';
  // Request to the lol api
  apiRequest(lol.regions[region].host + '/api/lol/' + region + '/v1.4/summoner/by-name/' + encodeURIComponent(summonerName) + '?api_key=' + keys.apiKey, true, function(err, body) {
    if (err === 404) {
      callback([{
        msg: "Summoner does not exist."
      }], null);
    } else {
      callback(null, JSON.parse(body)[summonerName.toLowerCase().replace(/ /g, '')]);
    }
  });
};

/**
 * Takes a summonerId and retrives the corresponding summoner data from the League of Legends API-
 * @param  {Integer} summonerId  The summonerId according to the League of Legends API to request.
 * @param  {String} region       The region to query.
 * @param  {function()} callback Callback to be executed when the operation finishes. Takes an error Object and the summoner data.
 */
exports.getSummonerById = function(summonerId, region, callback) {
  'use strict';
  // Request to the lol api
  apiRequest(lol.regions[region].host + '/api/lol/' + region + '/v1.4/summoner/' + summonerId + '?api_key=' + keys.apiKey, false, function(err, body) {
    if (err === 404) {
      callback([{
        msg: "Summoner does not exist."
      }], null);
    } else {
      callback(null, JSON.parse(body)[summonerId]);
    }
  });
};

/**
 * Get the current game for the given summonerId and region.
 * @param {Number} summonerId   The summonerId according to the League of Legends API to request.
 * @param {String} region       The region to query.
 * @param {function()} callback Callback to be executed when the operation finishes. Takes an error Object and the game data.
 */
exports.getCurrentGame = function(summonerId, region, callback) {
  'use strict';
  // Request to the lol api
  apiRequest(lol.regions[region].host + '/observer-mode/rest/consumer/getSpectatorGameInfo/' + lol.regions[region].platform + '/' + summonerId + '?api_key=' + keys.apiKey, true, function(err, body) {
    if (err !== 404) {
      callback([{
        msg: "There has been an error accessing the data."
      }], null);
    } else {
      callback(err, JSON.parse(body));
    }
  });
};

/**
 * Get the champion masteries for the given summoner.
 * @param {Object} summoner     The summoner object to query.
 * @param {function()} callback Callback to be executed when the operation finishes. Takes an error Object and the champion mastery data.
 */
exports.getMasteryBySummoner = function(summoner, callback) {
  'use strict';
  // Request to the lol api
  apiRequest(lol.regions[summoner.region].host + '/championmastery/location/' + lol.regions[summoner.region].platform + '/player/' + summoner.summonerId + '/champions?api_key=' + keys.apiKey, true, function(err, body) {
    if (err === 404) {
      callback([{
        msg: "Summoner does not exist."
      }], null);
    } else {
      callback(null, JSON.parse(body));
    }
  });
};