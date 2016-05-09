var colors = require('colors/safe');

/**
 * Logs the given message
 * @param  {string} message   The log message
 * @param  {string} level     The log level, one of 'info', 'warn', 'error', 'debug', 'apiRequest', 'background', defaults to 'info'
 * @param  {string} indicator Indicator to show the position where the log comes from, defaults to '[LOGGER]'
 * @param  {Object} metadata  Metadata to log with the message, defaults to {}
 */
exports.log = function(message, level, indicator, metadata) {
  'use strict';
  // Set the color code depending on the log level.
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
  // Set default indicator
  if (!indicator) {
    indicator = '[LOGGER]';
  }
  // Set default metadata
  if (!metadata) {
    metadata = {};
  }
  // Print message to console
  console.log(level + ': ' + indicator + ' - ' + message + ', ' + JSON.stringify(metadata));
};