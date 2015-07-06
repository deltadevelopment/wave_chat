'use strict';

var userManager = require('./usermanager.js');
var bucketManager = require('./bucketmanager.js');

var client = {};

/**
  * Convenience function for quitting a user and cleaning up after them
  *
  * @method quit
  * @param {Object} clientObj The user's client object
  * @param {Function} the callback to call when done
  * @param {String} [reason] The reason we're quitting them
  */
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
    bucketManager.partAll(clientSession, function() {
      // Good. Now remove the user's session.
      userManager.remLocalUser(clientSession.uid, function() {
        completeQuit();
      });
    });
  }
};

module.exports = client;
