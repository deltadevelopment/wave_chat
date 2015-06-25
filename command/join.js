var error = require('../core/error.js');
var bucketManager = require('../core/bucketmanager');

'use strict';

var cmdJoin = {};

cmdJoin.command = 'join';
cmdJoin.preAuth = false;
cmdJoin.params = {
  required: {
    bucket: null
  }
};

cmdJoin.handle = function(params, userSession) {
  bucketManager.hasMember(userSession, params.bucket, function(isMember) {
    if (isMember === true) {
      error.do(userSession.client, 500, 'Protocol error. Can\'t couble join buckets');
      return;
    }

    bucketManager.join(userSession, params.bucket);
  });
};

module.exports = cmdJoin;
