'use strict';

var config = require('../config.js'); // eslint-disable-line no-unused-vars

var argi;
for (argi in process.argv) {
  var param = process.argv[argi];
  if (param.indexOf('--') !== 0) {
    continue;
  }

  var key, value;
  var delimiter = param.indexOf('=');
  delimiter = delimiter === -1 ? undefined : delimiter;
  key = param.substring(2, delimiter);
  value = (delimiter === undefined ? undefined : param.substring(delimiter + 1));

  if (key.length <= 7 || key.substring(0, 7) !== 'config.') {
    key = 'config.' + key;
  }
  eval(key + '=' + value); // eslint-disable-line no-eval
}
