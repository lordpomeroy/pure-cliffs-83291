// public/system/controllers/AppCtrl.js

// Controller for the index.html to control application wide alerts
angular.module('AppCtrl', []).controller('AppController', ['$scope', 'AlertService',
  function($scope, AlertService) {
    'use strict';
    $scope.alerts = AlertService.alerts;
  }
]);