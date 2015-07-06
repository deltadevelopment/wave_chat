'use strict';

var util = require('util');
var db = require('./db.js');
var api = require('./api.js');
var _ = require('underscore');
var config = require('../config.js');
var userManager = require('./usermanager.js');
var bucketManager = require('./bucketmanager.js');

var message = {};

var incomingListeners = [];

/**
  * Add a method to call when we receive messages from remote servers
  *
  * @method addIncomingListener
  * @param {Function} callback The method to call on new message.
  */
message.addIncomingListener = function(method) {
  if (_.contains(incomingListeners, method)) {
    return;
  }

  incomingListeners.push(method);
};

/**
  * Remote a callback from the incoming listener table
  *
  * @method remIncomingListener
  * @param {Function} method The function to remove the callback from
  */
message.remIncomingListener = function(method) {
  incomingListeners = _.without(incomingListeners, method);
};

/**
  * Create a message object
  *
  * @method createMessage
  * @param {String} senderId The sending user's id
  * @param {String} bucketId The bucket's id
  * @param {String} msg The message string
  */
message.createMessage = function(senderId, bucketId, msg) {
  return {
    ts: Date.now(),
    sender: senderId,
    bucket: bucketId,
    message: msg
  };
};

/**
  * Convenience method for sending a message.
  * This method will send to local, remote and watching
  * users as needed.
  *
  * @method sendMessage
  * @param {Object} message
  */
message.sendMessage = function(messageObj) {
  var sentToUsers = message.sendMessageLocal(messageObj);

  message.sendMessageRemote(messageObj, function(remoteUsersSentTo) {
    sentToUsers = sentToUsers.concat(remoteUsersSentTo);
    message.sendNotification(messageObj.sender, messageObj.bucket, sentToUsers);
  });
};

/**
  * Send a message to local users
  *
  * @method sendMessageLocal
  * @param {Object} message
  * @return {List} A list over the user ids we sent to
  */
message.sendMessageLocal = function(messageObj) {
  var messageJson = JSON.stringify(messageObj);

  var bucketUsersLocal = bucketManager.getLocalMembers(messageObj.bucket);

  var i;
  for (i in bucketUsersLocal) {
    if (bucketUsersLocal[i] === messageObj.sender) {
      continue;
    }

    var curUserSess = userManager.findLocalUser(bucketUsersLocal[i]);
    if (curUserSess === null) {
      console.error('Bug: Reference found to local user which does not have a session!');
      continue;
    }

    curUserSess.client.write(messageJson);
  }

  return bucketUsersLocal;
};

/**
  * Send a message to remote users
  *
  * @method sendMessageRemote
  * @param {Object} message
  */
message.sendMessageRemote = function(messageObj, callback) {
  bucketManager.getRemoteMembers(messageObj.bucket, function(remoteMemberList) {
    userManager.getSessions(remoteMemberList, function(sessionList) {
      var targetServers = [];
      var usersSentTo = [];

      var i;
      for (i in sessionList) {
        if (sessionList[i].server === config.server.id) {
          continue;
        }

        usersSentTo.push(sessionList[i].uid);
        targetServers.push(sessionList[i].server);
      }

      if (targetServers.length === 0) {
        return;
      }

      targetServers = _.uniq(targetServers);

      var messageJson = JSON.stringify(messageObj);
      var dbCommands = [];
      for (i in targetServers) {
        dbCommands = dbCommands.concat([
          [
            'rpush',
            util.format('server:%s:messages', targetServers[i]),
            messageJson
          ]
        ]);
      }

      if (config.debug) {
        console.log('Sending message to other server');
        console.log(messageJson);
      }

      db.multi(dbCommands).exec(function(err) {
        if (err) {
          console.log('Error: Could not send messages to remote server: %s', err);
          return;
        }

        if (callback !== undefined) {
          callback(usersSentTo);
        }
      });
    });
  });
};

/**
  * Send a 'ripple'
  *
  * @param {String} senderId The id of the sending user
  * @param {String} bucketId The target bucket
  * @param {Array} exempt A list over users we have sent the message to
  * directly or remotely.
  */
message.sendNotification = function(senderId, bucketId, exempt) {
  api.sendInteractionMessage(senderId, bucketId, exempt);
};

/**
  * Internal function to look for messages from remote servers.
  *
  * @method lookForRemoteMessages
  */
function lookForRemoteMessages() {
  if (config.debug) {
    console.log('Debug: Checking for new messages');
  }

  var dbCommands = [
    [
      'lrange',
      util.format('server:%s:messages', config.server.id),
      0,
      -1
    ],
    [
      'del',
      util.format('server:%s:messages', config.server.id)
    ]
  ];


  db.multi(dbCommands).exec(function(err, data) {
    if (err) {
      console.error('Error: Could not get messages from Redis: %s:', err);
      return;
    }



    var msg = data[0][1];
    if (msg.length === 0) {
      if (config.debug) {
        console.log('Debug: No messages');
      }
      return;
    }

    if (config.debug) {
      console.log('Debug: Received messages');
      console.log(msg);
    }

    var i;
    for (i in msg) {
      var messageObj;
      try {
        console.log(msg[i]);
        messageObj = JSON.parse(msg[i]);
      } catch (ex) {
        console.error('Error: Failed to parse message: %s', msg[i]);
        continue;
      }

      var u;
      for (u in incomingListeners) {
        incomingListeners[u](messageObj);
      }
    }
  });
}

// Look for remote messages with us as the destination
setInterval(lookForRemoteMessages, config.message.update);

module.exports = message;
