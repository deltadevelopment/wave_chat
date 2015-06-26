'use strict';

var net = require('net');
var config = require('./config.js');
var error = require('./core/error.js');
//var server = require('./core/server.js');
var command = require('./core/command.js');
var userManager = require('./core/usermanager.js');
var bucketManager = require('./core/bucketmanager.js');

net.createServer(function(client) {
  // Client connected
  client.on('data', function(data) {
    try {
      data = JSON.parse(data.toString());
    } catch (err) {
      error.do(client, 500, 'The client sent garbage.');
      return;
    }
    command.handle(client, data);
  });

  client.on('end', function() {
    if (config.debug) {
      console.log('Debug: Disconnecting user %s', client.remoteAddress);
    }

    var userSession = userManager.findSession(client);
    if (userSession) {
      bucketManager.partAll(userSession, function() {
        userManager.remLocalUser(userSession.uid);
      });
    } else {
      userManager.remWaitingAuth(client);
    }
  });

  client.on('error', function() {
    // An error occured
  });
}).listen(config.server.port);
