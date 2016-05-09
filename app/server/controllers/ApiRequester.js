var appPath = process.cwd() + '/app/';

// Dependencies
require(appPath + 'server/models/Summoner.js');

var mongoose = require('mongoose');
var Summoner = mongoose.model('Summoner');
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
  var requestUrl;
  if (priorityRequets.length > 0) {
    requestUrl = priorityRequets.shift().url;
  } else {
    requestUrl = normalRequests.shift().url;
  }
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
      if (response.statusCode === 404) {
        callback(404, body);
      } else if (response.statusCode === 429) {
        // retry if we recieved an 429, set timeout by recieved header
        setTimeout(apiRequest, response.headers['retry-after'] * 1000, url, priority, callback);
      } else if (response.statusCode === 500) {
        // retry if we recieved an 500, set timeout to 5 min
        setTimeout(apiRequest, 5 * 60 * 1000, url, priority, callback);
      } else {
        // TODO alle anderen Statuscodes abfangen
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
 * @param {function()} callback
 */
exports.getStaticDataVersion = function(callback) {
  'use strict';
  var config = null;

  try {
    var data = fs.readFileSync(versionConfig);
    config = JSON.parse(data);
  } catch (err) {
    console.log('There has been an error parsing your JSON.');
    console.log(err);
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
    console.log(lol.apiStatic + 'v1.2/versions?api_key=' + keys.apiKey);
    request.get(lol.apiStatic + 'v1.2/versions?api_key=' + keys.apiKey, function(error, response, body) {
      if (error !== null) {
        callback(null, error);
      } else {
        var data = JSON.parse(body);
        var version = data[0];
        var config = {
          version: version,
          lastUpdated: new Date()
        };

        fs.writeFile(versionConfig, JSON.stringify(config), function(err) {
          if (err) {
            console.log('There has been an error saving your configuration data.');
            console.log(err.message);
            callback(null, err);
          } else {
            callback(config.version, null);
          }
        });
      }
    });
  } else {
    console.log('Use saved data dragon version.');
    callback(config.version, null);
  }
};

/**
 * Gets the profile picture for the given id from the data dragon and pipes it to the given res stream
 * @param {int} pictureId
 * @param {Object} res
 */
exports.getProfilePicture = function(pictureId, res) {
  'use strict';
  console.log('ApiRequester - getProfilePicture');
  exports.getStaticDataVersion(function(version) {
    console.log(lol.dataDragonBase + version + lol.dataDragonProfilePicture + pictureId + '.png');
    var url = lol.dataDragonBase + version + lol.dataDragonProfilePicture + pictureId + '.png';
    request.get(url).pipe(res);
  });
};

/**
 * Download the current champion data from the data dragon and store it locally.
 */
exports.getChampionData = function(callback) {
  'use strict';
  exports.getStaticDataVersion(function(version) {
    console.log(lol.dataDragonBase + version + lol.dataDragonUSData + 'champion.json');
    request.get(lol.dataDragonBase + version + lol.dataDragonUSData + 'champion.json', function(error, response, body) {
      if (error !== null) {
        callback(null, error);
      } else {
        var data = {
          championData: JSON.parse(body),
          lastUpdated: new Date()
        };
        fs.writeFile(championData, JSON.stringify(data), function(err) {
          if (err) {
            console.log('There has been an error saving your champion data.');
            console.log(err.message);
          }
          callback(null, data);
        });
      }
    });
  });
};

/**
 * Gets the champion loading picture for the given champion id from the data dragon and pipes it to the given res stream
 * @param {int} champion
 * @param {Object} res
 */
exports.getChampionLoadingPicture = function(champion, res) {
  'use strict';
  console.log(lol.dataDragonBase + lol.dataDragonChampionLoadingPicture + champion + '_0.jpg');
  var url = lol.dataDragonBase + lol.dataDragonChampionLoadingPicture + champion + '_0.jpg';
  request.get(url).pipe(res);
};

/**
 * Gets the champion loading picture for the given champion id from the data dragon and pipes it to the given res stream
 * @param {int} champion
 * @param {Object} res
 */
exports.getChampionSquarePicture = function(champion, res) {
  'use strict';
  exports.getStaticDataVersion(function(version) {
    console.log(lol.dataDragonBase + version + lol.dataDragonChampionSquarePicture + champion + '.png');
    var url = lol.dataDragonBase + version + lol.dataDragonChampionSquarePicture + champion + '.png';
    request.get(url).pipe(res);
  });
};

// ====================================================================
// Functions to check a summoner and the champion masteries
// ====================================================================

/**
 * Send an request to the League API
 * @param {Object} summonerName
 * @param {function()} callback
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
      // TODO alle anderen Statuscodes abfangen
      callback(null, JSON.parse(body)[summonerName.toLowerCase().replace(/ /g, '')]);
    }
  });
};

/**
 *
 * @param {Object} summonerId
 * @param {function()} callback
 */
exports.getSummonerById = function(summonerId, region, callback) {
  'use strict';
  // Request to the lol api
  apiRequest(lol.regions[region].host + '/api/lol/' + region + '/v1.4/summoner/' + encodeURIComponent(summonerId) + '?api_key=' + keys.apiKey, false, function(err, body) {
    if (err === 404) {
      callback([{
        msg: "Summoner does not exist."
      }], null);
    } else {
      // TODO alle anderen Statuscodes abfangen
      callback(null, JSON.parse(body)[summonerId]);
    }
  });
};

/**
 * Get the current game for the given summoner id and region.
 * @param {Number} summonerId
 * @param {String} region
 * @param {Object} callback
 */
exports.getCurrentGame = function(summonerId, region, callback) {
  'use strict';
  if (summonerId === null) {
    console.log('Summoner may not be empty');
    callback(null, null);
    return;
  }
  apiRequest(lol.regions[region].host + '/observer-mode/rest/consumer/getSpectatorGameInfo/' + lol.regions[region].platform + '/' + summonerId + '?api_key=' + keys.apiKey, true, function(err, body) {
    if (err) {
      console.log(err);
    }
    callback(err, JSON.parse(body));
  });
};

exports.getMasteryBySummoner = function(summoner, callback) {
  'use strict';
  // Request to the lol api
  apiRequest(lol.regions[summoner.region].host + '/championmastery/location/' + lol.regions[summoner.region].platform + '/player/' + summoner.summonerId + '/champions?api_key=' + keys.apiKey, true, function(err, body) {
    if (err === 404) {
      callback([{
        msg: "Summoner does not exist."
      }], null);
    } else {
      // TODO alle anderen Statuscodes abfangen
      callback(null, JSON.parse(body));
    }
  });
};