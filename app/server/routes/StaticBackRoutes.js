var controller = require('../controllers/StaticBackController');

module.exports = function(router) {
  'use strict';
  router.get('/static/champion', controller.getChampions);
};