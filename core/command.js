'use strict';

var _ = require('underscore');
var error = require('./error.js');
var config = require('../config.js');
var userManager = require('./usermanager');
var command = {};

// preAuth makes session be replaced with client

command.handle = function(clientObj, cmdObj) {
  var commandList = require('require-dir')('../command');
  if (userManager.isWaitingAuth(clientObj)) {
    if (config.debug) {
      console.log('-- Defering message --');
      console.log(cmdObj);
    }

    if (clientObj.waitMsg === undefined) {
      clientObj.waitMsg = [];
    }

    clientObj.waitMsg.push(cmdObj);
    return;
  }

  if (config.debug) {
    console.log('-- Received Message --');
    console.log(cmdObj);
  }

  if (typeof cmdObj !== 'object') {
    error.do(clientObj, 500, 'Command object of unexpected type');
    return;
  }

  if (cmdObj.command === undefined) {
    error.do(clientObj, 500, 'Command object not valid');
    return;
  }

  var curCmd = _.find(commandList, function(tmpObj) {
    return (tmpObj.command === cmdObj.command);
  });

  if (curCmd === undefined) {
    error.do(clientObj, 404, 'The requested command does not exist');
    return;
  }

  // Make sure all required parameters are provided
  var paramKey = '';
  for (paramKey in curCmd.params.required) {
    if ((cmdObj.params === undefined) || !(paramKey in cmdObj.params)) {
      error.do(clientObj, 404, 'Missing command parameter');
      return;
    }
  }

  // Make sure no unknown parameters are provided
  paramKey = '';
  for (paramKey in cmdObj.params) {
    if (!(paramKey in curCmd.params.required) && !(paramKey in curCmd.params.optional)) {
      error.do(clientObj, 404, 'Parameter not valid for command');
      return;
    } else {
      // Validate the input
      var paramPath = curCmd.params.required[paramKey] ? curCmd.params.required : curCmd.params.optional;
      var typeCheckFailed = false;
      switch (typeof paramPath[paramKey]) {
        case 'string':
          // Validate based on data type
          if (typeof cmdObj.params[paramKey] !== paramPath[paramKey]) {
            if (typeof cmdObj.params[paramKey] === 'number' && paramPath[paramKey] === 'string') {
              // Convert nubmer to string
              cmdObj.params[paramKey] = '' + cmdObj.params[paramKey];
            } else {
              typeCheckFailed = true;
            }
          }
          break;
        case 'function':
          // Validate using a provided function
          typeCheckFailed = paramPath[paramKey](cmdObj.params[paramKey]);
          break;
      }

      if (typeCheckFailed) {
        error.do(clientObj, 500, 'A parameter does not have the expected type');
        return;
      }
    }
  }

  if (curCmd.preAuth === true) {
    curCmd.handle(cmdObj.params, clientObj);
    return;
  }

  var userSession = userManager.findSession(clientObj);
  if (!userSession) {
    error.do(clientObj, 403, 'You need to authenticate to run this command');
    return;
  }
  curCmd.handle(cmdObj.params, userSession);
};

module.exports = command;
