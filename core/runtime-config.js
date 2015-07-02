'use strict';

var _ = require('underscore');
var config = require('../config.js');

config.args = [];
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
  config.args.push([key, value]);
}

function findKey(needle) {
  return _.find(config.args, function(cmpObj) {
    return (cmpObj[0] === needle);
  });
}

if ((key = findKey('id')) !== undefined) {
  var serverId = key[1];
  config.server.id = serverId;
}

if ((key = findKey('port')) !== undefined) {
  var serverPort = key[1];
  config.server.port = serverPort;
}
