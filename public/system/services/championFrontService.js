// public/system/services/championFrontService.js
angular.module('ChampionService', []).factory('ChampionService', ['$http', 'AlertService',
  function($http, AlertService) {
    'use strict';
    var ChampionService = {
      // Storage for the champion data
      champions: {}
    };

    /**
     * Gets the champion data from the server an stores it locally.
     */
    ChampionService.get = function() {
      // Send the request to the server
      return $http.get('/api/static/champion', {}).then(function(body) {
        for (var key in body.data) {
          ChampionService.champions[body.data[key].id] = body.data[key];
        }
      }, function(error) {
        // Add alerts in case of a failed request
        AlertService.addErrorMessages(error.data);
      });
    };

    /** 
     * Helper function to get a champion by key.
     * @param {Integer} key - key of the champion to retrieve
     */
    ChampionService.getByKey = function(key) {
      for (var champion in ChampionService.champions) {
        if (ChampionService.champions[champion].key === key.toString()) {
          return ChampionService.champions[champion];
        }
      }
    };

    return ChampionService;
  }
]);