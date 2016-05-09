// public/system/controllers/ChampionStatisticCtrl.js

// Controller for the champion.html to show statistics for a single champion in a region
angular.module('ChampionStatisticCtrl', []).controller('ChampionStatisticController', ['$scope', '$filter', '$state', 'StatisticService', 'ChampionService', '$stateParams', 'NgTableParams',
  function($scope, $filter, $state, StatisticService, ChampionService, $stateParams, NgTableParams) {
    'use strict';
    // Pass Data to the view
    $scope.championData = ChampionService.champions[$stateParams.champion];
    $scope.championStatistic = StatisticService.statistic.champions[$scope.championData.key];

    // Set the state value to differntate from the regional overview
    $scope.state = $state.current.name;
    // Set the region to use it in the view
    $scope.region = $state.params.region;

    // Set up tha table
    $scope.tableParams = new NgTableParams({
      // Intital page size and sorting
      count: 25,
      sorting: {
        championPoints: 'desc'
      }
    }, {
      total: $scope.championStatistic.players.length,
      getData: function(params) {
        // Filter and sort the data
        var orderedData = $filter('filter')($scope.championStatistic.players, $scope.filter);
        orderedData = params.sorting() ? $filter('orderBy')(orderedData, params.orderBy()) : orderedData;
        // Calculate the remainging size of the dataset after filtering
        params.total(orderedData.length);
        // Return the page data
        var pageData = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());
        return pageData;
      }
    });
  }
]);