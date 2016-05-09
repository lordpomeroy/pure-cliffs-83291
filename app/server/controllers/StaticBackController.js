var appPath = process.cwd() + '/app/';

// Dependencies
var request = require('request');
var ApiRequester = require('./ApiRequester.js');
var Cache = require('./Cache.js');

// ====================================================================
// Config
// ====================================================================
var championDataFile = 'downloads/champion.json';

// ====================================================================
// Main Functions
// ====================================================================

/**
 * @param {Object} req
 * @param {Object} res
 */
exports.getChampions = function(req, res) {
  'use strict';
  Cache.getChampions(function(err, champion){
    if (err) {
      return res.status(400).send(err);
    } else {
      return res.json(champion);
    }
  });
};

// ====================================================================
// Picture Stream Functions
// ====================================================================

/**
 * 
 * @param {Object} req
 * @param {Object} res
 */
exports.getProfilePicture = function(req, res) {
  'use strict';
  console.log('StaticBackController - getProfilePicture');
  ApiRequester.getProfilePicture(req.params.pictureId, res);
};

/**
 * @param  {Object} req
 * @param  {Object} res
 */
exports.getChampionPictureByName = function(req, res) {
  'use strict';
  ApiRequester.getChampionLoadingPicture(req.params.champion, res);
};

/**
 * @param  {Object} req
 * @param  {Object} res
 */
exports.getSquareChampionPictureByName = function(req, res) {
  'use strict';
  ApiRequester.getChampionSquarePicture(req.params.champion, res);
};