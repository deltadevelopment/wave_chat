'use strict';

var util = require('util');
var db = require('./db.js');
var config = require('../config.js');
var bucketManager = require('../core/bucketmanager');
var userManager = require('../core/usermanager.js');

setInterval(function() {
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

    var message = data[0][1];
    if (message.length === 0) {
      if (config.debug) {
        console.log('Debug: No messages');
      }
      return;
    }

    console.log('Debug: Received messages');
    console.log(message);

    var i;
    for (i in message) {
      var messageObj;
      try {
        messageObj = JSON.parse(message[i]);
      } catch (ex) {
        console.error('Error: Failed to parse message: %s', message[i]);
        continue;
      }

      var bucketMembers = bucketManager.getLocalMembers(messageObj.bucket);

      var u;
      for (u in bucketMembers) {
        var currentSession = userManager.findLocalUser(bucketMembers[u]);
        if (currentSession === null) {
          console.warn('Warning: Got a remote message for a user we don\'t have');
          continue;
        }

        currentSession.client.write(message[i]);//message[i]);
      }
    }
  });

}, 2500);
