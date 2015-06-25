'use strict';

var error = require('../core/error.js');
var bucketManager = require('../core/bucketmanager.js');

var cmdSend = {};

cmdSend.command = 'send';
cmdSend.preAuth = false;
cmdSend.params = {
  required: {
    bucket: null,
    message: null
  }
};

cmdSend.handle = function(params, userSession) {
  bucketManager.hasMember(userSession, params.bucket, function(isMember) {
    if (isMember === false) {
      error.do(userSession.client, 500, 'Protocol error. Can\'t send to buckets the member is not part of');
      return;
    }

  });
};

module.exports = cmdSend;