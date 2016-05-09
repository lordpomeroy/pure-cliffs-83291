// public/js/controllers/MainCtrl.js
angular.module('MainCtrl', []).controller('MainController', ['$scope', 'SummonerService', 'StatisticService',
  function($scope, SummonerService, StatisticService) {
    'use strict';
    $scope.itemArray = ['BR', 'EUNE', 'EUW', 'LAN', 'LAS', 'NA', 'OCE', 'RU', 'TU', 'SEA', 'KR'];

    $scope.selected = $scope.itemArray[2];
    $scope.searching = false;
    $scope.summoner = null;

    $scope.sorting = 'score';
    $scope.order = 'asc';

    $scope.searchSummoner = function() {
      $scope.searching = true;
      $scope.summoner = null;
      SummonerService.getOne($scope.selected, $scope.summonerName).then(function() {
        if (SummonerService.summoner) {
          $scope.summoner = SummonerService.summoner;
          $scope.masteryScore = 0;
          for (var i = 0; i < $scope.summoner.masteries.length; i++) {
            $scope.masteryScore += $scope.summoner.masteries[i].championLevel;
          }
          if ($scope.selected === 'EUW' || $scope.selected === 'NA') {
            StatisticService.get($scope.selected).then(function() {
              $scope.championStatistic = StatisticService.statistic.champions;
              $scope.summonerCount = StatisticService.statistic.summonerCount;
              var sortByPoints = function(a, b) {
                return b.championPoints - a.championPoints;
              };
              for (var champion in $scope.championStatistic) {
                for (var i = 0; i < $scope.summoner.masteries.length; i++) {
                  if (champion === $scope.summoner.masteries[i].champion.key) {
                    $scope.championStatistic[champion].players.sort(sortByPoints);
                    for (var j = 0; j < $scope.championStatistic[champion].players.length; j++) {
                      if ($scope.championStatistic[champion].players[j].summonerName === $scope.summoner.summonerName) {
                        $scope.summoner.masteries[i].ranking = 'Rank in region: ' + (j + 1);
                        break;
                      }
                    }
                    break;
                  }
                }
              }
              $scope.searching = false;
            });
          } else {
            $scope.searching = false;
          }
        } else {
          $scope.searching = false;
        }
      });
    };

    $scope.selectRegion = function(regionIndex) {
      $scope.selected = $scope.itemArray[regionIndex];
    };

    $scope.searchAgain = function(){
      $scope.searching = false;
      $scope.summoner = null;
    };

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