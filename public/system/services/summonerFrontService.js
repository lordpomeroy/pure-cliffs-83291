// public/system/services/summonerFrontService.js
angular.module('SummonerService', []).factory('SummonerService', ['$http', '$q', 'ChampionService', 'AlertService',
  function($http, $q, ChampionService, AlertService) {
    'use strict';
    var SummonerService = {
      // Storage for the current summoner object
      summoner: {}
    };

    /**
     * Request a single summoner from the server by region and summonerName. The found summoner is stored at SummonerService.summoner.
     * Furthermore the Champions are filled with data from the ChampionService.
     * On error the recieved error messages are displayed as alerts
     * @param  {String} region - search region
     * @param  {String} summonerName - summoner name to retrieve
     */
    SummonerService.getOne = function(region, summonerName) {
      // Delete the surrently stored data to detect errors correctly
      SummonerService.summoner = undefined;
      // Send the request to the server
      return $http.get('/api/summoner/' + region + '/' + summonerName, {}).then(function(body) {
        SummonerService.summoner = body.data;
        // Fill the champion data
        ChampionService.get().then(function() {
          for (var i = 0; i < SummonerService.summoner.masteries.length; i++) {
            // Add champion data and remove the champion id
            SummonerService.summoner.masteries[i].champion = ChampionService.getByKey(SummonerService.summoner.masteries[i].championId);
            delete SummonerService.summoner.masteries[i].championId;
          }
        });
      }, function(error) {
        // Add alerts in case of a failed request
        AlertService.addErrorMessages(error.data);
      });
    };
    return SummonerService;
  }
]);