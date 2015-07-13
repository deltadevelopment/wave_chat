'use strict';

var net = require('net');
var config = require('./config.js');
require('./core/runtime-config.js');
var error = require('./core/error.js');
var server = require('./core/server.js');
var command = require('./core/command.js');
var userManager = require('./core/usermanager.js');
var bucketManager = require('./core/bucketmanager.js');
var convenience = require('./core/convenience.js');

console.log('Server ID: %s', config.server.id);

net.createServer(function(client) {
  // Client connected
  if (config.debug) {
    console.log('Debug: Client connected: %s', client.remoteAddress);
  }

  client.on('data', function(data) {
    try {
      data = JSON.parse(data.toString());
    } catch (err) {
      if (config.debug) {
        console.log('--- Could not parse JSON from client --');
        console.log(err);
        console.log(data.toString());
      }
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

console.log('Listening on port %s ', config.server.port);

process.on('SIGINT', function() {
  function performExit() {
    server.shutdown(function() {
      console.log('Shutdown complete');
      process.exit(); // eslint-disable-line no-process-exit
    });
  }

  console.log('Got SIGINT - Initializing shutdown');

  var localUserList = userManager.getLocalUsers();

  var i = 0, quitUserCounter = 0;
  for (i in localUserList) {
    convenience.quit(localUserList[i].client, function() { // eslint-disable-line no-loop-func
      ++quitUserCounter;

      if (quitUserCounter === localUserList.length) {
        performExit();
      }
    });
  }

  if (localUserList.length === 0) {
    performExit();
  }

});
