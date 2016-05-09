// public/system/services/alertFrontService.js
angular.module('AlertService', []).factory('AlertService', ['$timeout',
  function($timeout) {
    'use strict';
    var AlertService = {
      // array that contains all active alerts.
      alerts: []
    };

    var height = 62;
    var alertIndex = 0;

    /**
     * Create a new alert.
     * @param {string} text - text of the alert
     * @param {string} type - type of the alert
     */
    var addAlert = function(text, type) {
      AlertService.alerts.push({
        msg: text,
        type: type,
        pos: alertIndex * height
      });
      alertIndex++;
      // Add timeout to automatically close the alert after 3 seconds
      $timeout(function() {
        AlertService.closeAlert(0);
      }, 3000);
    };

    /**
     * Create a new alert of the type danger.
     * @param {string} text - text of the alert
     */
    AlertService.addDanger = function(text) {
      addAlert(text, 'alert-danger');
    };

    /**
     * Add the error messages as alerts. Takes a returned error array from the server.
     * @param {Object[]} array - array of errors including a msg attribute
     */
    AlertService.addErrorMessages = function(array) {
      for (var i = 0; i < array.length; i++) {
        AlertService.addDanger(array[i].msg);
      }
    };

    /**
     * Create a new alert of the type information.
     * @param {string} text - text of the alert
     */
    AlertService.addInfo = function(text) {
      addAlert(text, 'alert-info');
    };

    /**
     * Create a new alert of the type success.
     * @param {string} text - text of the alert
     */
    AlertService.addSuccess = function(text) {
      addAlert(text, 'alert-success');
    };

    /**
     * Create a new alert of the type warning.
     * @param {string} text - text of the alert
     */
    AlertService.addWarning = function(text) {
      addAlert(text, 'alert-warning');
    };

    /**
     * Close the alert at the given index of the alert array.
     * @param {Object} index - index of the alert to remove
     */
    AlertService.closeAlert = function(index) {
      AlertService.alerts.splice(index, 1);
      for (var i = index; i < AlertService.alerts.length; i++) {
        AlertService.alerts[i].pos -= height;
      }
      if (alertIndex > 0) {
        alertIndex--;
      }
    };

    return AlertService;
  }
]);