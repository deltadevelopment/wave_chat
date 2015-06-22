'use strict';

var util = require('util');
var _ = require('underscore');
var config = require('../config.js');
var db = require('./db.js');

var server = {};

server.removeGoneServers = function (goneServerList) {
  if (goneServerList.length === 0) {
    return;
  }

  if (config.debug) {
    console.log('Debug: Removing servers that have gone away');
    console.log(goneServerList);
  }

  var removeCommand = 'db.multi()';
  var i = 0;
  for (i in goneServerList) {
    removeCommand += ".del(util.format('server:%s:alive', " + goneServerList[i] + '))';
    removeCommand += ".srem('server:list', " + goneServerList[i] + ')';
  }
  removeCommand += '.exec(function(err, data) { })';
  eval(removeCommand);
};

server.clusterMaintain = function () {
  if (config.debug === true) {
    console.log('Debug: Running clusterMaintain()');
  }

  db.multi()
    .sadd('server:list', config.serverId)
    .set(util.format('server:%s:alive', config.serverId), '1')
    .expire(util.format('server:%s:alive', config.serverId), 15)
    .exec(function(err) {
      if (err != null) {
        if (config.debug === true) {
          throw new Error(util.format('An error occured writing to Redis: %s', err));
        }
        console.error('Error: Failed to write to Redis: %s', err);
      }

      server.checkIfMaster();
      setTimeout(server.clusterMaintain, 10000);
    });
};

server.checkIfMaster = function() {
  db.smembers('server:list', function(err, data) {
    if (err !== null) {
      console.error('Error: Redis-call failed while checking which server is the master. Error: %s', err);
      return;
    }

    // Make sure it's in an order where the one with the lowest ID is checked first
    // It will probably be in this order from Redis, but sets are unordered so Redis can do what it wants, so let's be sure.
    data = _.sortBy(data, function(num) {
      return num;
    });

    // Right here my recommendation is to stop reading and find a spoon to gorge your eyes outh with.
    // What this block of code does is to check one server at the time if it's alive.
    // We're doing this without blocking or checking all servers at the same time, and thus it's a bit messy.
    // We're also maintaining a goneServerList, as we're treating the data we need for that here anyway.
    var goneServerList = [];
    var foundBoss = false;
    var i = 0;
    var loopTick = function() {
      if (i < data.length) {
        db.get(util.format('server:%s:alive', data[i]), function(innerErr, innerData) {
          if (err !== null) {
            if (config.debug) {
              throw new Error('An error occured while getting data from Redis: %s', err);
            }
            console.error('An error occured while getting data from Redis: %s', err);
            i = data.length;
          }

          if (data[i] < config.serverId && innerData != null && innerData.toString() === '1') {
            if (config.debug) {
              console.log('Another server (%s) found to be in charge', data[i]);
            }
            foundBoss = true;
            goneServerList = null;
            return;
          } else if (data[i].toString() === config.serverId.toString()) {
            if (config.debug) {
              console.log('This server found to be in charge');
            }
            foundBoss = true;
          } else if (innerData == null) {
            goneServerList.push(data[i]);
          }

          ++i;
          setImmediate(loopTick);
        });
      } else {
        if (foundBoss === false) {
          throw new Error('No server found to be in charge!');
        }

        if (goneServerList != null) {
          server.removeGoneServers(goneServerList);
        }
      }
    };
    loopTick();
  });
};

server.clusterMaintain();

module.exports = server;
