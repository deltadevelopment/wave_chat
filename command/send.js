'use strict';

var error = require('../core/error.js');
var bucketManager = require('../core/bucketmanager.js');
var message = require('../core/message.js');

var cmdSend = {};

cmdSend.command = 'send';
cmdSend.preAuth = false;
cmdSend.params = {
  required: {
    bucket: null,
    drop: null,
    message: null
  }
};

cmdSend.handle = function(params, userSession) {
  bucketManager.hasMember(userSession, params.bucket, function(isMember) {
    if (isMember === false) {
      error.do(userSession.client, 500, 'Protocol error. Can\'t send to buckets the member is not part of');
      return;
    }

    var messageObj = message.createMessage(userSession.uid, params.bucket, params.drop, params.message);
    message.sendMessage(messageObj);
    bucketManager.storeMessage(params.bucket, messageObj);
  });
};

cmdSend.handleRemote = function(messageObj) {
  message.sendMessageLocal(messageObj);
};

message.addIncomingListener(cmdSend.handleRemote);


module.exports = cmdSend;
