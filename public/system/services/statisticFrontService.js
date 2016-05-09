// public/system/services/statisticFrontService.js
angular.module('StatisticService', []).factory('StatisticService', ['$http', 'ChampionService', 'AlertService',
  function($http, ChampionService, AlertService) {
    'use strict';
    var StatisticService = {
      // Storage for the statistical data
      statistic: {}
    };

    /**
     * Gets the statistical data for the given region from the server an stores it locally.
     * @param {String} region - region to get the data for
     */
    StatisticService.get = function(region) {
      // Send the request to the server
      return $http.get('/api/statistic/' + region, {}).then(function(body) {
        StatisticService.statistic = body.data;
        return ChampionService.get();
      }, function(error) {
        // Add alerts in case of a failed request
        AlertService.addErrorMessages(error.data);
      });
    };

    return StatisticService;
  }
]);