'use strict';

var util = require('util');
var db = require('./db.js');
var _ = require('underscore');
var duck = require('./duck.js');
var config = require('../config.js');
var usermanager = require('./usermanager.js');

// TODO: Worry about what happens if a server goes away
// Currently there is no way for another server to easily clean up after another server without iterating
// all the channels to find out what members is part of each. Store copy on user in Redis?
// Should probably replace the 'store on session' thing I'm currently doing with that

/**
  * A collection of functions for managing buckets.
  *
  *
  * Datastore:
  *
  * SET bucket:%s:members, bucketId
  *
  * LIST bucket:%s:messages, bucketId
  * @class bucketManager
  */

var bucketManager = { };
var localBuckets = [];

/**
  * Join a user to a bucket.
  *
  * @method join
  * @param {Object} userObj The user object to join to the bucket
  * @param {String} bucketId THe bucket id to join the user to
  * @param {Function} [callback] The callback to call when the user has joined
  */
bucketManager.join = function(userObj, bucketId, callback) {
  if (config.debug) {
    duck.ensureDuck(userObj, usermanager.localDuckProto, true);
  }

  db.sadd(util.format('bucket:%s:members', bucketId), userObj.uid, function(err, data) {
    if (err) {
      console.error('Error: Database error: ', err);
      return;
    }

    if (userObj.channels === undefined) {
      userObj.channels = [];
    }

    if (localBuckets[bucketId.toString()] === undefined) {
      localBuckets[bucketId.toString()] = [];
    }

    userObj.channels.push(bucketId.toString());
    localBuckets[bucketId.toString()].push(userObj.uid);

    if (config.debug) {
      console.log('Debug: %s at joining %s from %s', (data.toString() === '1' ? 'Succeded' : 'Failed'), userObj.uid, bucketId);
    }

    if (callback !== undefined) {
      callback(data);
    }
  });
};

bucketManager.hasMember = function(userObj, bucketId, callback) {
  db.sismember(util.format('bucket:%s:members', bucketId), userObj.uid, function(err, data) {
    if (err) {
      console.error('Error: Database error: ', err);
      return;
    }
    callback((data.toString() === '1'));
  });
};

bucketManager.getLocalMembers = function(bucketId) {
  return (localBuckets[bucketId] || []);
};

bucketManager.getMembers = function(bucketId, callback) {
  db.smembers(util.format('bucket:%s:members', bucketId), function(err, data) {
    if (err) {
      console.error('Error: Database error: ', err);
      return;
    }

    callback(data);
  });
};

/**
  * Part a user from a bucket.
  *
  * @method part
  * @param {Object} userObj The user object to part from the bucket
  * @param {String} bucketId The bucket to part the user from
  * @param {Function} [callback] The callback to call when the user has parted
  */
bucketManager.part = function(userObj, bucketId, callback) {
  if (config.debug) {
    duck.ensureDuck(userObj, usermanager.localDuckProto);
  }

  db.srem(util.format('bucket:%s:members', bucketId), userObj.uid, function(err, data) {
    if (err) {
      console.error('Error: Database error: ', err);
      return;
    }

    userObj.channels = _.without(userObj.channels, bucketId.toString());
    localBuckets[bucketId.toString()] = _.without(localBuckets[bucketId.toString()], userObj.uid);

    if (config.debug) {
      console.log('Debug: %s at parting %s from %s', (data.toString() === '1' ? 'Succeded' : 'Failed'), userObj.uid, bucketId);
    }

    if (callback !== undefined) {
      callback(data);
    }
  });
};

bucketManager.partAll = function(userObj, cbParam, callback) {
  var isDone = false;
  var reqSent = 0;
  var ansRecv = 0;

  if (userObj.channels === undefined || userObj.channels.length === 0) {
    callback(cbParam);
    return;
  }

  var i;
  var channelCopy = _.clone(userObj.channels);
  for (i in channelCopy) {
    ++reqSent;
    bucketManager.part(userObj, channelCopy[i], function() {
      ++ansRecv;
      if (ansRecv === reqSent && isDone) {
        if (callback !== undefined) {
          callback(cbParam);
        }
      }
    });
  }
  isDone = true;
};

/**
  * Store a message to a bucket.
  * This function stores and trims to the backlog in the same process.
  *
  * @method storeMessage
  * @param {String} bucketId The bucketId to store to
  * @param {Object} messageObj The message object to store
  * @param {Function} [callback] The callback to call when the message is stored
  */
bucketManager.storeMessage = function(bucketId, messageObj, callback) {
  db.multi()
    .rpush(util.format('bucket:%s:messages', bucketId), JSON.stringify(messageObj))
    .ltrim(util.format('bucket:%s:messages', bucketId), -config.message.backlog, -1)
    .exec(function(err) {
      if (err) {
        console.error('Error: Could not store message to DB: ', messageObj);
        return;
      }
      if (callback !== undefined) {
        callback();
      }
    });
};

/**
  * Get the X latest messages in a bucket.
  *
  * @method getMessages
  * @param {String} bucketId The bucket to get messages from
  * @param {Function} callback The callback to call with the message data
  * @param {Integer} [entries = config.message.showlog] How many messages to get
  */
bucketManager.getMessages = function(bucketId, callback, entries) {
  if (entries === undefined) {
    entries = config.message.showlog;
  }

  db.lrange(util.format('bucket:%s:messages', bucketId), -entries, -1);
};

/**
  * Destory a bucket.
  * This deletes all data associated with the bucket.
  *
  * @method destroy
  * @param {String} bucketId The id of the bucket we want to destroy
  * @param {Function} [callback] The callback to call when the bucket is destroyed
  */
bucketManager.destroy = function(bucketId, callback) {
  db.multi()
    .del(util.format('bucket:%s:members', bucketId))
    .del(util.format('bucket:%s:messages', bucketId))
    .exec(function(err) {
      if (err) {
        console.error('Error: Failed to delete bucket %s from DB: %s', bucketId, err);
        return;
      }

      delete bucketUsers[bucketId];
    });
};


module.exports = bucketManager;
