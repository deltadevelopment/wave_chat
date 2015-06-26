'use strict';

var util = require('util');
var uuid = require('uuid');
var db = require('./db.js');
var _ = require('underscore');
var duck = require('./duck.js');
var config = require('../config.js');

var userManager = {};

/**
  * Datastore:
  * SET session:ref, userId
  * session:obj:%s, userId, sessionObj
  * SET server:%s:users, serverId, userId
  */

userManager.remoteDuckProto = {
  uuid: null,
  uid: null,
  server: null
};

userManager.localDuckProto = {
  uuid: null,
  uid: null,
  server: null,
  client: null
};

var localUsers = [];
var waitingAuth = [];

userManager.addWaitingAuth = function(clientObj) {
  waitingAuth.push(clientObj);
};

userManager.remWaitingAuth = function(clientObj) {
  waitingAuth = _.without(waitingAuth, clientObj);
};

userManager.isWaitingAuth = function(clientObj) {
  return (_.contains(waitingAuth, clientObj));
};

userManager.findSession = function(clientObj) {
  return (_.find(localUsers, function(cmpObj) {
    return (cmpObj.client === clientObj);
  }) || null);
};

/**
  * Associate a client object and user id into a session.
  * Writes the session to DB so other servers will know about it.
  *
  * @method addLocalUser
  * @param {Object} clientObj The client object to assiciate
  * @param {String} userId The user id to associate
  * @param {Function} callback The callback to call when the user is added
  * fn(Boolean), true on success, false on failure.
  */
userManager.addLocalUser = function(clientObj, userId, callback) {
  var userSession = {
    uuid: uuid.v4(),
    uid: userId,
    server: config.server.id,
    client: clientObj
  };

  if (config.debug === true) {
    duck.ensureDuck(userSession, userManager.localDuckProto);

    if (_.find(localUsers, function(cmpObj) {
      return (cmpObj.uid === userId);
    })) {
      throw new Error('Tried to create two sessions for the same user.');
    }
  }

  db.sadd('session:ref', userSession.uid, function(err, data) {
    if (err) {
      // TODO: Critical error - disconnect user
      console.error('Error: Could not add user %s to session list: ', userSession.uid, err);
      return;
    }

    if (data.toString() === '0') {
      if (config.debug) {
        console.log('Debug: Not adding %s to session list. It already exists.', userSession.uid);
        callback(false);
        return;
      }
    } else if (data.toString() === '1') {
      // Good - we got insert on the user - that means we own the session.
      // Let's insert the session object, and in the server's private session list as well.
      var remoteSessionData = {
        uuid: userSession.uuid,
        uid: userSession.uid,
        server: userSession.server
      };

      db.multi()
        .set(util.format('session:obj:%s', userSession.uid), JSON.stringify(remoteSessionData))
        .sadd(util.format('server:%s:users', config.server.id), userSession.uid)
        .exec(function(innerErr) {
          if (innerErr) {
            console.error('Error: Failed to write user %s\'s session object to DB', userSession.uid);
            return;
          }
          if (config.debug) {
            console.log('Debug: Adding user %s to the localUser list', userId);
          }
          localUsers.push(userSession);
          if (callback !== undefined) {
            callback(true);
          }
        });
      } else {
      throw new Error('Unexpected value while inserting %s\'s user session to DB', userSession.uid);
    }
  });
};

/**
  * Remotes a user session.
  * Deletes the session from DB.
  *
  * @method remLocalUser
  * @param {String} The user id of the user to remove a session from
  */
userManager.remLocalUser = function(userId) {
  var sessionObj = userManager.findLocalUser(userId);
  if (config.debug === true) {
    if (sessionObj === undefined) {
      throw new Error('Tried to remove user not added to the localUser list');
    }
    console.log('Debug: Removing user %s from localUser list', userId);
  }

  // No session found for the user
  if (sessionObj === undefined) {
    console.error('Tried to remove user not added to the localUser list');
    return;
  }

  db.multi()
    .srem('session:ref', userId)
    .srem(util.format('server:%s:users', config.server.id), userId)
    .del(util.format('session:obj:%s', userId))
    .exec(function(err, data) {
      if (err) {
        throw new Error('Critical error: Failed to remove user %s\'s session from DB. Can\'t continue.', userId);
      }
      console.log('Todo - put in a check for this:');
      console.log(data);
    });

  localUsers = _.without(localUsers, sessionObj);
};

/**
  * Check if a user id has a local session.
  *
  * @method findLocalUser
  * @param {String} userId The user id to look for
  * @return The session object, or null if not found
  */
userManager.findLocalUser = function(userId) {
  var sessionObj = _.find(localUsers, function(cmpObj) {
    return (cmpObj.uid === userId);
  });

  if (config.debug === true) {
    if (sessionObj === undefined) {
      console.log('Debug: Failed to find user %s in the localUser list', userId);
    } else {
      console.log('Debug: Found user %s in the localUser list', userId);
    }
  }

  return (sessionObj || null);
};

/**
  * Check if a remote server has a user.
  *
  * @method find
  User
  * @param {String} userId the user id to look for
  * @param {Function} callback The callback to call when done
  * fn(Object, Boolean), the session object if found, null if not, boolean is true if the user is local
  */
userManager.findUser = function(userId, callback) {
  db.get(util.format('session:obj:%s', userId), function(err, data) {
    if (err) {
      console.error('Error: Could not get session info from DB for user %s', userId);
      return;
    }

    if (data === null) {
      callback(null);
      return;
    }
    data = JSON.parse(data);
    callback(data, data.server === config.server.id);
  });
};

module.exports = userManager;
