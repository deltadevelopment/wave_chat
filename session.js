var u = require('util')
var _ = require('underscore');
var uuid = require('uuid');

var db = require('./db.js');
var api = require('./api.js');
var usr = require('./user.js');
var config = require('./config.js');

var sess = { };
sess.list = { };

/**
  * Check if a sessionKey is valid for a user.
  * @param The user id to check.
  * @param The sessionKey to check
  * @param The callback: function(userId, success)
  */
sess.isAuth = function (userId, sessionKey, callback) {
  callback('testUser', true);
}

/**
  * Adds a session to the local session table,
  * and to Redis. This allows other servers to know
  * that the client is online and what server it is on.
  * This command also adds the userId to the client object.
  * client.userId = userId;
  * @param The user id to add.
  * @param The client connection object to add.
  */
sess.addSession = function(userId, client) {
  var sessionInfo = {
    server: config.serverId,
    ts: Date.now(),
    uuid: uuid.v4(),
  };

  db.redis.set(u.format('session:%s', userId), sessionInfo);

  client.userId = userId;

  delete sessionInfo.server;
  sessionInfo.client = client;
  sess.list[userId] = sessionInfo;
}

/**
  * Remove a session from the local session table,
  * and from Redis. This makes sure other servers knows
  * when we don't manage a user anymore.
  * @param The user id to remove
  */
sess.remSession = function(userId) {
  if (typeof userId == 'object' && typeof userId.userId != 'undefined')
    userId = userId.userId;

  var tmpSess = _.find(sess.list, function(kvpValue, kvpKey) {
    return (kvpKey === userId);
  });

  if (typeof tmpSess === 'undefined')
    return;

  delete tmpSess.client;

  sess.list = _.without(sess.list, tmpSess);
  db.redis.del(u.format('session:%s', userId));
}

/**
  * Check if we have a session for a user.
  * @param The user id or client object to check.
  * @return True if we do, false if not.
  */
sess.hasLocalSession = function(checkObj) {
  if (typeof checkObj == 'object') {
    return (_.find(sess.list, function(kvpVal, kvpKey) {
      return (kvpVal.client == checkObj);
    }) || null);
  }

  return (_.find(sess.list, function(kvpVal, kvpKey) {
    return (kvpKey == checkObj);
  }) || null);
}

/**
  * Check if another server has a session for a user.
  * @param The user id to check.
  * @param The callback: function(userId, hasUser)
  */
sess.hasRemotesession = function(userId, callback) {
  db.redis.get('session:%s', userId, function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    callback(userId, (data != null));
  });
}

/**
  * Write message to clients.
  */
sess.writeMessage = function(targetId, messageObj) {
  // TODO: Handle more servers than one.
  // To support this, we can store info about what user is
  // at what servers in Redis, and use a Redis list, per server,
  // for messages, where we push in one end and pop the other.

  // Check if the user is local
  var targetSession = sess.hasLocalSession(targetId);
  if (targetSession == null)
    return null; // Not a local session. This isn't supported yet.

  targetSession.client.write(messageObj.message);

}

module.exports = sess;
