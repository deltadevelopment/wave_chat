var _ = require('underscore');
var u = require('util');
var db = require('./db.js');
var helpers = require('./helpers.js');

/**
  * Access a user object.
  * @param The user's id
  */
function user(userId) {
  this.id = userId.toString();
}

/**
  * Check if the user is watching a given channel.
  * @param The channel id or object.
  * @param The callback: function(user, channelId, containsUser)
  */
user.prototype.isWatching = function(channelId, callback) {
  channelId = helpers.getObjectId(channelId);
  var that = this;
  db.redis.lrange(u.format('user:%s:watching', this.id), 0, -1, function(err, data) {
    if (typeof callback !== 'undefined')
      callback(that, channelId, _.contains(data, channelId));
  });
}

/**
  * Start watching a channel.
  * @param The channel id or object to watch.
  * @param The callback: function(user, channelId, watchAdded)
  * Note: watchAdded is true if a watch was added,
  * false if it was already in the list.
  */
user.prototype.addWatching = function(channelId) {
  channelId = helpers.getObjectId(channelId);
  var that = this;

  this.isWatching(channelId, function(undefined, undefined, isWatching) {
    if (isWatching) {
      if (typeof callback !== 'undefined')
        callback(chan, userId, false);
      return;
    }

    db.redis.rpush(u.format('user:%s:watching', that.id), channelId);
    if (typeof callback !== 'undefined')
      callback (that, channelId, true);
  });
}

/**
  * Stop watching a channel.
  * @param The channel id or objecty to stop watching.
  * @param The callback: function(user, channelId, watchRemoved)
  * Note: watchRemoved is true if a watch was removed,
  * false if there was no watch to remove.
  */
user.prototype.remWatching = function(channelId, callback) {
  var that = this;

  db.redis.lrem('user:%s:watching', 0, this.id, function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    if (typeof callback !== 'undefined')
      callback(that, channelId, data > 0);
  });
}

/**
  * Get a list over channel ids this user is watching.
  * @param The callback: function(user, channelList)
  */
user.prototype.getWatching = function(callback) {
  var that = this;
  db.redis.lrange(u.format('user:%s:watching', this.id), 0, -1, function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    if (typeof callback !== 'undefined')
      callback(that, data);
  });
}


// TODO: Move those to session.js
/**
  * Check if a sessionKey is cached and usable.
  * @param The sessionKey to check.
  * @param The callback: function(user, authSuccess)
  * Note: authSuccess is true if the sessionKey is valid,
  * false if not.
  */
user.prototype.hasAuthSession = function(sessionKey, callback) {
  var that = this;
  db.redis.get(u.format('user:%s:session', this.id), function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    if (typeof callback !== 'undefined')
      callback(that, (sessionKey === data));
  });
}

/**
  * Set a sessionKey.
  * @param The sessionKey to set.
  * @param How long it takes for it to timeout, in seconds from now.
  */
user.prototype.setAuthSession = function(sessionKey, timeout) {
  db.redis.multi()
    .set(u.format('user:%s:session'), sessionKey)
    .expire(u.format('user:%s:session'), expires)
    .exec(function(err, data) {
      if (err) {
        console.error(u.format('Log error: %s', err));
        return;
      }
    });
}

module.exports = user;
