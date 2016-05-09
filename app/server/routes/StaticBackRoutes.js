var controller = require('../controllers/StaticBackController');

module.exports = function(router) {
  'use strict';
  router.get('/static/profile/:pictureId', controller.getProfilePicture);
  router.get('/static/champion', controller.getChampions);
  router.get('/static/champion/loading/:champion', controller.getChampionPictureByName);
  router.get('/static/champion/square/:champion', controller.getSquareChampionPictureByName);
};