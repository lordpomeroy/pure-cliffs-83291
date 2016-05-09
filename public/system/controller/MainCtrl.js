// public/js/controllers/MainCtrl.js
angular.module('MainCtrl', []).controller('MainController', ['$scope', 'SummonerService', 'StatisticService',
  function($scope, SummonerService, StatisticService) {
    'use strict';
    // Show all regions as option
    $scope.itemArray = ['BR', 'EUNE', 'EUW', 'LAN', 'LAS', 'NA', 'OCE', 'RU', 'TU', 'SEA', 'KR'];
    // Default to EUW
    $scope.selected = $scope.itemArray[2];

    $scope.searching = false;
    $scope.summoner = null;

    // Current sorting order
    $scope.sorting = 'score';
    $scope.order = 'asc';

    // Searches a summoner
    $scope.searchSummoner = function() {
      $scope.searching = true;
      $scope.summoner = null;
      // Get the summoner
      SummonerService.getOne($scope.selected, $scope.summonerName).then(function() {
        // Process the data
        if (SummonerService.summoner) {
          $scope.summoner = SummonerService.summoner;
          $scope.masteryScore = 0;
          for (var i = 0; i < $scope.summoner.masteries.length; i++) {
            $scope.masteryScore += $scope.summoner.masteries[i].championLevel;
          }
          // For EUW and NA show statistical data
          if ($scope.selected === 'EUW' || $scope.selected === 'NA') {
            StatisticService.get($scope.selected).then(function() {
              $scope.championStatistic = StatisticService.statistic.champions;
              $scope.summonerCount = StatisticService.statistic.summonerCount;
              var sortByPoints = function(a, b) {
                return b.championPoints - a.championPoints;
              };
              // Process the retrieved statistic data and find the summoners rank in his region
              for (var champion in $scope.championStatistic) {
                for (var i = 0; i < $scope.summoner.masteries.length; i++) {
                  if (champion === $scope.summoner.masteries[i].champion.key) {
                    $scope.championStatistic[champion].players.sort(sortByPoints);
                    for (var j = 0; j < $scope.championStatistic[champion].players.length; j++) {
                      if ($scope.championStatistic[champion].players[j].summonerName === $scope.summoner.summonerName) {
                        $scope.summoner.masteries[i].ranking = j + 1;
                        break;
                      }
                    }
                    break;
                  }
                }
              }
              // Disable the searching spinner
              $scope.searching = false;
            });
          } else {
            // Disable the searching spinner
            $scope.searching = false;
          }
        } else {
          // Disable the searching spinner
          $scope.searching = false;
        }
      });
    };

    // Update region on select
    $scope.selectRegion = function(regionIndex) {
      $scope.selected = $scope.itemArray[regionIndex];
    };

    // Clear the summoner data
    $scope.searchAgain = function() {
      $scope.searching = false;
      $scope.summoner = null;
      $scope.summonerName = '';
    };

    // Sort the data by Champion points
    $scope.sortByScore = function() {
      if ($scope.sorting === 'score') {
        if ($scope.order === 'asc') {
          $scope.order = 'desc';
        } else {
          $scope.order = 'asc';
        }
      } else {
        $scope.order = 'asc';
      }
      $scope.sorting = 'score';
      $scope.summoner.masteries.sort(function(a, b) {
        if ($scope.order === 'asc') {
          return a.championPoints - b.championPoints;
        } else {
          return b.championPoints - a.championPoints;
        }
      });
    };

    // Sort the data to maximise champion mastery level, by missing to next level
    $scope.sortByMax = function() {
      $scope.sorting = 'max';
      $scope.summoner.masteries.sort(function(a, b) {
        if (a.championLevel === 5 && b.championLevel === 5) {
          return a.championPoints - b.championPoints;
        } else if (a.championLevel === 5) {
          return +1;
        } else if (b.championLevel === 5) {
          return -1;
        } else {
          return a.championPointsUntilNextLevel - b.championPointsUntilNextLevel;
        }
      });
    };

    // Sort by ranking in the region
    $scope.sortByRanking = function() {
      if ($scope.sorting === 'ranking') {
        if ($scope.order === 'asc') {
          $scope.order = 'desc';
        } else {
          $scope.order = 'asc';
        }
      } else {
        $scope.order = 'asc';
      }
      $scope.sorting = 'ranking';
      $scope.summoner.masteries.sort(function(a, b) {
        if ($scope.order === 'asc') {
          return a.ranking - b.ranking;
        } else {
          return b.ranking - a.ranking;
        }
      });
    };

  }
]);