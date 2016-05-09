var appPath = process.cwd() + '/app/';

// Dependencies
var Cache = require('./Cache.js');

// ====================================================================
// Main Functions
// ====================================================================

/**
 * Retrieves the champion data from cache.
 * @param {Object} req - express request object
 * @param {Object} res - express response object
 */
exports.getChampions = function(req, res) {
  'use strict';
  Cache.getChampions(function(err, champions) {
    if (err) {
      return res.status(400).send(err);
    } else {
      return res.json(champions);
    }
  });
};