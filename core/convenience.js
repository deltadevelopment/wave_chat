'use strict';

var userManager = require('./usermanager.js');
var bucketManager = require('./bucketmanager.js');

var client = {};

client.quit = function(clientObj, callback, reason) {
  var completeQuit = function() {
    clientObj.end(reason);

    if (callback !== undefined) {
      callback();
    }
  };
  // Check if we have a session
  var clientSession = userManager.findSession(clientObj);
  if (clientSession === null) {
    // The user can't be in any bucket if they're not having a session.
    // Remove the user from the waitAuth list if he's there and bedone.
      userManager.remWaitingAuth(clientObj);
      completeQuit();
      return;
  } else {
    // The user might be in channels.
    // Remove him from them.
    bucketManager.partAll(clientSession, undefined, function() {
      // Good. Now remove the user's session.
      userManager.remLocalUser(clientSession.uid, function() {
        completeQuit();
      });
    });
  }
};

module.exports = client;
