'use strict';

var util = require('util');
var uuid = require('uuid');
var db = require('./db.js');
var _ = require('underscore');
var duck = require('./duck.js');
var error = require('./error.js');
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

/**
  * Get a cloned list over local user sessions
  * It is safe to iterate this list and remove user sessions
  *
  * @method getLocalUsers
  * @return {Array} A list over user sessions
  */
userManager.getLocalUsers = function() {
  return _.clone(localUsers);
};

/**
  * Add a user to the list over users waiting for authentication
  * We do this so we can buffer commands while waiting for db
  *
  * @method addWaitingAuth
  * @param {Object} clientObj The user's client object
  */
userManager.addWaitingAuth = function(clientObj) {
  waitingAuth.push(clientObj);
};

/**
  * Take the user out of the waiting auth list
  *
  * @method remWaitingAuth
  * @param {Object} clientObj The user's client object
  */
userManager.remWaitingAuth = function(clientObj) {
  waitingAuth = _.without(waitingAuth, clientObj);
};

/**
  * Is a user in the waiting auth list?
  *
  * @method isWaitingAuth
  * @method {Object} clientObj The user's client object
  */
userManager.isWaitingAuth = function(clientObj) {
  return (_.contains(waitingAuth, clientObj));
};

/**
  * Check if a client object has a session associated with it
  *
  * @method findSession
  * @param {Object} clientObj The user's client object
  * @return null or the session object
  */
userManager.findSession = function(clientObj) {
  return (_.find(localUsers, function(cmpObj) {
    return (cmpObj.client === clientObj);
  }) || null);
};

/**
  * Get session objects from Redis
  *
  * @method getSessions
  * @param {Array} userList An array over the user ids to check for
  * @param {Function} callback The callback to call with the list
  */
userManager.getSessions = function(userList, callback) {
  var dbCommands = [];
  var i;
  for (i in userList) {
    dbCommands = dbCommands.concat([
      [
      'get',
      util.format('session:obj:%s', userList[i])
      ]
    ]);
  }

  db.multi(dbCommands).exec(function(err, data) {
    if (err) {
      console.error('Error: Could not get session from DB: %s', err);
      return;
    }

    var retData = [];
    for (i in data) {
      retData.push(JSON.parse(data[i][1]));
    }

    callback(retData);
  });
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
      error.do(userSession.client, 500, 'Internal Server Error');
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
userManager.remLocalUser = function(userId, callback) {
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
    .exec(function(err) {
      if (err) {
        throw new Error('Critical error: Failed to remove user %s\'s session from DB. Can\'t continue.', userId);
      }

      localUsers = _.without(localUsers, sessionObj);
      if (callback !== undefined) {
        callback();
      }
    });

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
