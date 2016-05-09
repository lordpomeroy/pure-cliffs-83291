// public/system/controllers/StatisticCtrl.js
angular.module('StatisticCtrl', []).controller('StatisticController', ['$scope', '$state', 'StatisticService', 'ChampionService',
  function($scope, $state, StatisticService, ChampionService) {
    'use strict';
    $scope.itemArray = ['EUW', 'NA'];
    $scope.state = $state.current.name;

    $scope.selected = $state.params.region;
    $scope.sorting = 'alpha';

    $scope.searching = true;
    var sortable = [];
    var avg = [];

    StatisticService.get($scope.selected).then(function() {
      $scope.championStatistic = StatisticService.statistic.champions;
      $scope.summonerCount = StatisticService.statistic.summonerCount;
      $scope.champions = ChampionService.champions;
      for (var champion in $scope.champions) {
        sortable.push($scope.champions[champion]);
        avg.push($scope.champions[champion]);
      }
      sortable.sort(function(a, b) {
        return $scope.championStatistic[a.key].totalChampionPoints - $scope.championStatistic[b.key].totalChampionPoints;
      });
      avg.sort(function(a, b) {
        return ($scope.championStatistic[a.key].totalChampionPoints / $scope.championStatistic[a.key].totalPlayers) - ($scope.championStatistic[b.key].totalChampionPoints / $scope.championStatistic[b.key].totalPlayers);
      });
      console.log(avg);
      $scope.searching = false;
    });

    $scope.selectRegion = function(regionIndex) {
      $state.go('statistic', {
        region: $scope.itemArray[regionIndex]
      }, {
        reload: true
      });
    };

    $scope.sortByScore = function() {
      $scope.sorting = 'score';
      $scope.champions = sortable;
    };

    $scope.sortByAverage = function() {
      $scope.sorting = 'avg';
      $scope.champions = avg;
    };

    $scope.sortByAlpha = function() {
      $scope.sorting = 'alpha';
      $scope.champions = ChampionService.champions;
    };
  }
]);