'use strict';

var _ = require('underscore');
var config = require('../config.js');
var error = require('../core/error.js');
var bucketManager = require('../core/bucketmanager');

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

    if (typeof params.bucket === 'number') {
      params.bucket += '';
    }

    if (typeof params.bucket !== 'string') {
      error.do(userSession.client, 500, 'Channel names must be strings');
      return;
    }

    bucketManager.join(userSession, params.bucket, function() {
      bucketManager.getMessages(params.bucket, function(data) {
        if (data && !_.isEqual(data, [])) {
          if (config.debug) {
            console.log('--- Writing message backlog to client ---');
            console.log(data);
          }
          userSession.client.write(JSON.stringify(data));
        }
      });
    });
  });
};

module.exports = cmdJoin;
