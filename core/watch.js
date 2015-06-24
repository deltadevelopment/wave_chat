'use strict';

var util = require('util');
var db = require('./db.js');
var config = require('../config.js');

/**
  * This class contains functions for managing watching of buckets.
  *
  * Datastore:
  *
  * SET bucket:%s:watching
  *
  * SET user:%s:watching
  *
  * @class watchManager
  */

var watchManager = { };

/**
  * This function adds a watch-relationship between a user
  * and a channel.
  *
  * @method addWatch
  * @param {String} userId The id of the user
  * @param {String} bucketId The id of the bucket
  * @param {Function} callback The callback to call when done
  */
watchManager.addWatch = function(userId, bucketId, callback) {
  db.multi()
    .sadd(util.format('bucket:%s:watching', bucketId), userId)
    .sadd(util.format('user:%s:watching', userId), bucketId)
    .exec(function(err, data) {
      if (err) {
        console.error('Error: Redis failure: %s', err);
        return;
      }

      if (data[0][0] !== data[1][0] || data[0][1] !== data[1][1] || data[0][0] !== null) {
        if (config.debug) {
          console.log(data);
          throw new Error('data inconsistent!');
        }
        console.error('Error: Watchlist information for %s is inconsistent', data);
      }

      if (callback !== undefined) {
        callback(data[0][1].toString() === '1');
      }
    });
};

/**
  * This function removes a watch-relationship between
  * a user and a channel.
  *
  * @method remWatch
  * @param {String} userId The id of the user
  * @param {String} bucketId The id of the bucket
  * @param {Function} callback The callback to call when done
  */
watchManager.remWatch = function(userId, bucketId, callback) {
  db.multi()
    .srem(util.format('bucket:%s:watching', bucketId), userId)
    .srem(util.format('user:%s:watching', userId), bucketId)
    .exec(function(err, data) {
      if (err) {
        console.error('Error: Redis failure: %s', err);
        return;
      }

      if (data[0][0] !== data[1][0] || data[0][0] !== null) {
        if (config.debug) {
          console.log(data);
          throw new Error('data inconsistent!');
        }
        console.error('Error: Watchlist information for %s is inconsistent', data);
      }

      if (callback !== undefined) {
        callback(data[0][1].toString() === '1');
      }
    });
};

/**
  * Check if a user/channel relationship has a watch.
  *
  * @method hasWatch
  * @param {String} userId The user id to check against
  * @param {String} bucketId The bucket id to check against
  * @param {Function} callback The callback to call when done
  */
watchManager.hasWatch = function(userId, bucketId, callback) {
  db.sismember(util.format('user:%s:watching', userId), bucketId, function(err, data) {
    if (err) {
      console.error('Error: Redis failure: %s', err);
      return;
    }

    callback((data.toString() === '1'));
  });
};

/**
  * Clear all watches on a user.
  *
  * @param {String} userId The id of the user to clear all watches on
  */
watchManager.clearUserWatch = function(userId, callback) {
  db.smembers(util.format('user:%s:watching', userId), function(err, data) {
    if (err) {
      console.error('Error: Redis failure: %s', err);
      return;
    }

    var dbCommands = [];
    var i = 0;
    for (i in data) {
      dbCommands.push([
        'srem',
        util.format('bucket:%s:watching', data[i]),
        userId
      ]);
    }

    dbCommands.push([
      'del',
      util.format('user:%s:watching', userId)
    ]);

    db.multi(dbCommands).exec(function(innerErr) {
      if (innerErr) {
        console.error('Error: Redis failure: %s', err);
        return;
      }

      if (callback !== undefined) {
        callback();
      }
    });
  });
};

/**
  * Get all watches on a user
  *
  * @method getUserWatch
  * @param {String} userId
  * @param {Function} callback(buckets[]) The callback to call with the result
  */
watchManager.getUserWatch = function(userId, callback) {
  db.smembers(util.format('user:%s:watching', userId), function(err, data) {
    if (err) {
      console.error('Error: Redis failure: %s', err);
      return;
    }

    callback(data);
  });
};

/**
  * Clear all watches on a bucket
  *
  * @method clearBucketWatch
  * @param {String} bucketId The id of the bucket to clear watches from
  * @param {Function} callback The callback to call when done
  */
watchManager.clearBucketWatch = function(bucketId, callback) {
  db.smembers(util.format('bucket:%s:watching', bucketId), function(err, data) {
    if (err) {
      console.error('Error: Redis failure: %s', err);
      return;
    }

    var dbCommands = [];
    var i = 0;
    for (i in data) {
      dbCommands.push([
        'srem',
        util.format('user:%s:watching', data[i]),
        bucketId
      ]);
    }

    dbCommands.push([
      'del',
      util.format('bucket:%s:watching', bucketId)
    ]);

    db.multi(dbCommands).exec(function(innerErr) {
      if (innerErr) {
        console.error('Error: Redis failure: %s', err);
        return;
      }

      if (callback !== undefined) {
        callback();
      }
    });
  });
};

/**
  * Get a list over all users watching a bucket
  *
  * @method getBucketWatch
  * @param {String} bucketId The id of the bucket to check
  * @param {Function} callback The callback to call with the data
  */
watchManager.getBucketWatch = function(bucketId, callback) {
  db.smembers(util.format('bucket:%s:watching', bucketId), function(err, data) {
    if (err) {
      console.error('Error: Redis failure: %s', err);
      return;
    }

    callback(data);
  });
};

module.exports = watchManager;
