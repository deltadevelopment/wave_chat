'use strict';

var _ = require('underscore');
var api = require('../core/api.js');
var error = require('../core/error.js');
var command = require('../core/command.js');
var userManager = require('../core/usermanager.js');

var cmdAuth = {};

cmdAuth.command = 'auth';
cmdAuth.preAuth = true;
cmdAuth.params = {
  required: {
    userid: 'number',
    token: 'string'
  }
};

cmdAuth.handle = function(params, clientObj) {
  if (userManager.isWaitingAuth(clientObj)) {
    error.do(clientObj, 500, 'Tried to run auth while waiting waiting for a previous auth to finish');
    return;
  }

  if (userManager.findSession(clientObj)) {
    error.do(clientObj, 500, 'Protocol violation!');
    return;
  }

  userManager.addWaitingAuth(clientObj);
  userManager.findUser(params.userid, function(userFound) {
    if (userFound !== null) {
      error.do(clientObj, 500, 'Only one session per user is allowed!');
      return;
    }

    api.verifyToken(params.userid, params.token, function(isAuth) {
      if (!isAuth) {
        error.do(clientObj, 403, 'Invalid auth token');
        return;
      }

      userManager.addLocalUser(clientObj, params.userid, function() {
        userManager.remWaitingAuth(clientObj);

        if (clientObj.waitMsg !== undefined) {
          _.each(clientObj.waitMsg, function(item) {
            command.handle(clientObj, item);
          });
        }

      });
    });
  });
};

module.exports = cmdAuth;
