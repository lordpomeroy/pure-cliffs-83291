// public/system/controllers/ChampionStatisticCtrl.js
angular.module('ChampionStatisticCtrl', []).controller('ChampionStatisticController', ['$scope', '$filter', '$state', 'StatisticService', 'ChampionService', '$stateParams', 'NgTableParams',
  function($scope, $filter, $state, StatisticService, ChampionService, $stateParams, NgTableParams) {
    'use strict';
    $scope.championData = ChampionService.champions[$stateParams.champion];
    $scope.championStatistic = StatisticService.statistic.champions[$scope.championData.key];

    $scope.state = $state.current.name;
    $scope.region = $state.params.region;

    $scope.tableParams = new NgTableParams({
      count: 25,
      page: 1,
      total: $scope.championStatistic.length,
      sorting: {
        championPoints: 'desc'
      }
    }, {
      getData: function(params) {
        var orderedData = $filter('filter')($scope.championStatistic.players, $scope.filter);
        orderedData = params.sorting() ? $filter('orderBy')(orderedData, params.orderBy()) : orderedData;
        orderedData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
        return orderedData;
      }
    });

    $scope.watch('summonerName', function(newValue, olValue) {
      $scope.tableParams.filter({ $: $scope.summonerName });
    });
  }
]);