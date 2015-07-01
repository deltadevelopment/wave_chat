'use strict';

var api = require('../core/api.js');
var error = require('../core/error.js');
var userManager = require('../core/usermanager.js');

var cmdAuth = {};

cmdAuth.command = 'auth';
cmdAuth.preAuth = true;
cmdAuth.params = {
  required: {
    userid: null,
    token: null
  }
};

cmdAuth.handle = function(params, clientObj) {
  if (userManager.isWaitingAuth(clientObj)) {
    error.do(clientObj, 500, 'Tried to run auth while waiting waiting for a previous auth to finish');
    return;
  }

  if (typeof params.token !== 'string' || typeof params.userid !== 'string') {
    error.do(clientObj, 500, 'params.token of invalid type');
    return;
  }

  userManager.addWaitingAuth(clientObj);
  api.verifyToken(params.userid, params.token, function(isAuth) {
    if (!isAuth) {
      //error.do(clientObj.);
      return;
    }

    userManager.addLocalUser(clientObj, params.userid, function() {
      userManager.remWaitingAuth(clientObj);
    });
  });
};

module.exports = cmdAuth;
