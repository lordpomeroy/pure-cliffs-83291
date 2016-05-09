var controller = require('../controllers/SummonerBackController');

module.exports = function(router) {
  'use strict';
  router.get('/summoner/:region/:summonerName', controller.getSummonerByName);
};