'use strict';

var error = require('../core/error.js');
var bucketManager = require('../core/bucketmanager');

var cmdPart = {};

cmdPart.command = 'part';
cmdPart.preAuth = false;
cmdPart.params = {
  required: {
    bucket: null
  }
};

cmdPart.handle = function(params, userSession) {
  bucketManager.part(userSession, params.bucket, function(isParted) {
    if (!isParted) {
      error.do(userSession.client, 500, 'Protocol error. Tried to part bucket the user hasn\'t joined');
      return;
    }
  });
};

module.exports = cmdPart;
