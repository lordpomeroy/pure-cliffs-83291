var winston = require('winston');
var colors = require('colors/safe');

var logger = new(winston.Logger)({
  transports: [
    new(winston.transports.File)({
      filename: 'log/winston.log'
    })
  ]
});

/**
 * Logs the given message
 * @param  {string} message   The log message
 * @param  {string} level     The log level, one of 'silly', 'debug', 'verbose', 'info', 'warn', 'error', defaults to 'info'
 * @param  {string} indicator Indicator to show the position where the log comes from, defaults to '[LOGGER]'
 * @param  {Object} metadata  Metadata to log with the message, defaults to {}
 */
exports.log = function(message, level, indicator, metadata) {
  'use strict';
  if (level === 'info') {
    level = colors.green(level);
  } else if (level === 'warn') {
    level = colors.yellow(level);
  } else if (level === 'error') {
    level = colors.red(level);
  } else if (level === 'debug') {
    level = colors.blue(level);
  } else if (level === 'apiRequest') {
    level = colors.magenta(level);
  } else if (level === 'background') {
    level = colors.cyan(level);
  } else {
    level = colors.green('info');
  }
  if (!indicator) {
    indicator = '[LOGGER]';
  }
  if (!metadata) {
    metadata = {};
  }
  if (level !== 'background') {
    console.log(level + ': ' + indicator + ' - ' + message + ', ' + JSON.stringify(metadata));
  }
};