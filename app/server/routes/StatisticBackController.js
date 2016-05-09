var controller = require('../controllers/StatisticBackController');

module.exports = function(router) {
  'use strict';
  router.get('/statistic/:region', controller.getRegionStatistic);
};