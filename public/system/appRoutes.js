// public/js/appRoutes.js
angular.module('appRoutes', []).config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider) {
    'use strict';

    $stateProvider
      .state('home', {
        // home page
        url: '/home',
        templateUrl: 'system/views/home.html',
        controller: 'MainController'
      }).state('statistic', {
        // statistic page
        url: '/statistic/:region',
        templateUrl: 'system/views/statistic.html',
        controller: 'StatisticController'
      }).state('statistic.champion', {
        // champion statistic page
        url: '/:champion',
        templateUrl: 'system/views/champion.html',
        controller: 'ChampionStatisticController',
        resolve: {
          onEnter: ['$stateParams', 'StatisticService',
            function($stateParams, StatisticService) {
              return StatisticService.get($stateParams.region);
            }
          ]
        }
      }).state('about', {
        // about page
        url: '/about',
        templateUrl: 'system/views/about.html'
      });
    $urlRouterProvider.otherwise('/home');
  }
]).run(['$state', '$rootScope', '$stateParams',
  function($state, $rootScope, $stateParams) {
    'use strict';
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      $rootScope.isRouteLoading = true;
    });

    $rootScope.$on('$stateChangeSuccess', function() {
      $rootScope.isRouteLoading = false;
    });

    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
      console.log('State not Found');
      console.log(unfoundState);
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
      console.log('Error Changing State');
      console.log(error);
    });
  }
]);