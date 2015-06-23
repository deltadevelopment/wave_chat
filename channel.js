var _ = require('underscore');
var uuid = require('uuid');
var u = require('util');

var db = require('./db.js');
var sess = require('./session.js');
var config = require('./config.js');
var helpers = require('./helpers.js');

/**
  * Access a channel object.
  * @param The channel's id
  */
function channel(channelId) {
  this.id = channelId.toString();
}

/**
  * Check if a user belongs to a channel.
  * @param The user id or object to check.
  * @param The callback: function(channel, userId, hasUser)
  */
channel.prototype.hasUser = function(userId, callback) {
  userId = helpers.getObjectId(userId);
  var that = this;

  db.redis.lrange(u.format('channel:%s:users', this.id), 0, -1, function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    if (typeof callback !== 'undefined')
      callback(that, userId, _.contains(data, userId));
  });
}

/**
  * Add a user to the channel.
  * @param The user id or object to add.
  * @param The callback: function(channel, userId, userAdded)
  * Note: userAdded is true if the user wasn't in the list already,
  * false if it was.
  */
channel.prototype.addUser = function(userId, callback) {
  userId = helpers.getObjectId(userId);
  var that = this;

  this.hasUser(userId, function(undefined, undefined, hasUser) {
    if (hasUser) {
      if (typeof callback !== 'undefined')
        callback(that, userId, false);
      return;
    }

    db.redis.rpush(u.format('channel:%s:users', that.id), userId);
    callback (that, userId, true);
  });
}

/**
  * Remove a user from the channel.
  * @param The user id or objecty to remove.
  * @param The callback: function(channel, userId, userRemoved)
  * Note: userRemoved is true if the user was removed from the list,
  * false if it wasn't in the list.
  */
channel.prototype.remUser = function(userId, callback) {
  userId = helpers.getObjectId(userId);
  var that = this;
  db.redis.lrem('channel:%s:users', 0, this.id, function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    if (callback || null)
      callback(that, userId, data > 0);
  });
}

channel.prototype.addWatcher = function(userId, callback) {
  this.isWatching(userId, function(userIsWatching) {
    if (userIsWatching) {
      
      return;
    }
  });
}

channel.prototype.remWatcher = function(userId, callback) {

}

channel.prototype.isWatching = function(userId, callback) {
  db.redis.lrange(u.format('channel:%s:watchers', this.id), 0, -1, function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    if (_.contains(data, userId))
      callback(true);
    callback(false);
  });
}

channel.prototype.getWatchers = function(callback) {

}

channel.prototype.getLastInternal = function(userId, readSent, callback) {
  switch (readSent) {
    case 'read':
      readSent = 'lastRead';
      break;
    case 'sent':
      readSent = 'lastSent';
      break;
    default:
      throw new Error('readSent must be either \'read\' or \'sent\'');
  }

  userId = helpers.getObjectId(userId);
  var that = this;

  db.redis.get(u.format('channel:%s:users:%s:%s', this.id, userId, readSent), function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    callback(that, userId, data);
  });
}

/**
  * Set when a user last was sent a message from the channel.
  * @param The user id or object
  * @param The message uuid
  */
channel.prototype.setLastSent = function(userId, uuid) {
  userId = helpers.getObjectId(userId);
  db.redis.set(u.format('channel:%s:users:%s:lastSent', this.id, userId), uuid);
}

/**
  * Get when we last sent the user a message.
  * @param The user id or object to check
  * @param The callback: function(channel, userId, data)
  */
channel.prototype.getLastSent = function(userId, callback) {
  getLastInternal(userId, 'sent', callback);
}

/**
  * Set when a user last was read a message from the channel.
  * @param The user id or object
  * @param The message uuid
  */
channel.prototype.setLastRead = function(userId, uuid) {
  userId = helpers.getObjectId(userId);
  db.redis.set(u.format('channel:%s:users:%s:lastRead', this.id, userId), uuid);
}

/**
  * Get when we last sent the read a message.
  * @param The user id or object to check
  * @param The callback: function(channel, userId, data)
  */
channel.prototype.getLastRead = function(userId, uuid) {
  getLastInternal(userId, 'read', callback);
}

/**
  * Send a message to the channel.
  * This function will send a message to the channel,
  * and thus send it to all joined members, and notify
  * watching members if needed.
  * @param The sending user's id or object
  * @param The message. Must be a string.
  * @param TODO: To have a callback or not to have a callback?
  */
channel.prototype.sendMessage = function(senderId, msg, callback) {
  senderId = helpers.getObjectId(senderId);
  if (typeof msg != 'string')
    throw new Error('The msg argument must be a string');

  var messageObj = {
    uuid: uuid.v4(),
    sender: senderId,
    when: Date.now(),
    message: msg
  };

  db.redis.multi()
    // Get the users in the channel at the point we're inserting the message
    .lrange(u.format('channel:%s:users', this.id), 0, -1)
    // Remove messages overflowing the max amount of messages to store
    .ltrim(u.format('channel:%s:messages', this.id), -config.storeMessages, -1)
    .rpush(u.format('channel:%s:messages', this.id), JSON.stringify(messageObj))
    .exec(function(err, data) {
      if (err) {
        console.error(u.format('Log error: %s', err));
        return;
      }

      var userList = data[0][1];
      for (i in userList) {
        if (userList[i] == senderId)
          continue;
        sess.writeMessage(userList[i], messageObj);
      }
    });
}

/**
  * Get a list over the last messages in a channel.
  * @param Max amount of elements to get. 0 means all.
  * @param The callback: function(channel, data)
  */
channel.prototype.getMessages = function(num, callback) {
  if (num < 0)
    throw new Error('The num argument can\'t be negative');

  var that = this;
  db.redis.lrange(u.format('channel:%s:messages', this.id), -num, -1, function(err, data) {
    if (err) {
      console.error(u.format('Log error: %s', err));
      return;
    }

    callback(that, data)
  });
}

module.exports = channel;
