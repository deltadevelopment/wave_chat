'use strict';

var error = require('../core/error.js');
var bucketManager = require('../core/bucketmanager.js');
var userManager = require('../core/usermanager.js');
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

    var messageData = JSON.stringify({
      ts: Date.now(),
      bucket: params.bucket,
      sender: userSession.uid,
      message: params.message
    });

    // Figure out what local users are active in the channel
    var localMembers = bucketManager.getLocalMembers(params.bucket);

    var i;
    for (i in localMembers) {
      var targetUser = userManager.findLocalUser(localMembers[i]);
      if (!targetUser) {
        console.log('Error: Internal inconsistency between local bucket list and local user list');
        continue;
      }

      // We're not interested in sending to the sender
      /*if (userSession === targetUser) {
        continue;
      }*/

      targetUser.client.write(messageData);
    }

    // Figure out what users are active in the channel
    bucketManager.getMembers(params.bucket, function(memberList) {
      // We already send it to the local members. Let's ignore them.

    });
  });
};

module.exports = cmdSend;
