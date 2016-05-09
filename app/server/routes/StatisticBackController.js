var controller = require('../controllers/StatisticBackController');

module.exports = function(router) {
  'use strict';
  var route = '/statistic';
  router.get(route + '/:region', controller.getRegionStatistic);
};