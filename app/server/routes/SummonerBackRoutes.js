var controller = require('../controllers/SummonerBackController');

module.exports = function(router) {
  'use strict';
  var route = '/summoner';
  router.get(route + '/:region/:summonerName', controller.getSummonerByName);
};