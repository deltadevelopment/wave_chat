var u = require('util')
var _ = require('underscore');
var uuid = require('uuid');

var db = require('./db.js');
var api = require('./api.js');
var usr = require('./user.js');
var config = require('./config.js');

var sess = { };
sess.list = new Array();

/**
  * Check if a sessionKey is valid for a user.
  * @param The user id to check.
  * @param The sessionKey to check
  * @param The callback: function(userId, success)
  */
sess.isAuth = function (userId, sessionKey, callback) {
  callback(uuid.v4(), true);
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
  console.log('Adding user to session list: %s', userId);
}

sess.doAuth = function(client, authToken, callback) {
  api.getUserByAuthToken(authToken, function(res){
    if(res.hasOwnProperty("username")){
      sessionList.push(client);
      callback(true);
    } else{
      callback(false);
    }
  });
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

  var tmpSess = sess.hasLocalSession(userId);
  if (tmpSess == null)
    return;

  sess.list = _.without(sess.list, tmpSess);
  db.redis.del(u.format('session:%s', userId));
  console.log('Removing user from session list: %s', userId);
}

/**
  * Check if we have a session for a user.
  * @param The user id or client object to check.
  * @return True if we do, false if not.
  */
sess.hasLocalSession = function(checkObj) {
  var isObj = typeof checkObj === 'object';
  for (i in sess.list) {
    if (!isObj) {
      if (sess.list[i].client.userId === checkObj)
        return (sess.list[i]);
    } else {
      if (sess.list[i].client === checkObj)
        return (sess.list[i].client);
    }
  }
  return null;
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
  console.log('Looking for user: %s', targetId);
  var targetSession = sess.hasLocalSession(targetId);
  if (targetSession == null)
    return null; // Not a local session. This isn't supported yet.
  console.log('Found user: %s', targetSession.client.userId);

  targetSession.client.write(JSON.stringify(messageObj));
}

module.exports = sess;
