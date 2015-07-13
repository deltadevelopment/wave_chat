'use strict';

var util = require('util');
var _ = require('underscore');
var config = require('../config.js');
var db = require('./db.js');

/**
  * This class contains functions related to the management of the server,
  * and the server cluster. It is self-managing. When required,
  * it will keep track of what server is master, and clean up as needed.
  * Note: For efficiency reasons, this class handles the datastore of
  * other classes directly rather than going through them.
  * @class Server
  */
var server = {};
/** This variable holds the timeout-context for the clusterMaintain cycle */
var maintainContext = null;

/**
  * Clean up after servers which has gone away.
  * This includes removing session data of the users on the servers.
  * @method removeGoneServers
  * @param {Array} goneServerList A list over the server IDs to clean up
  */

server.removeGoneServers = function (goneServerList, callback) {
  if (goneServerList.length === 0) {
    if (callback !== undefined) {
      callback();
    }
    return;
  }

  if (config.debug) {
    console.log('Debug: Removing servers that have gone away');
    console.log(goneServerList);
  }


  var dbCommands = [];
  var i = 0;
  for (i in goneServerList) {
    dbCommands.push([
      'smembers',
      util.format('server:%s:users', goneServerList[i])
    ]);
  }

  db.multi(dbCommands).exec(function(err, purgeList) {
    if (err) {
      console.log('Error: ' + err);
      callback();
      return;
    }

    purgeList = purgeList[0];
    dbCommands = [];
    i = 0;
    for (i in goneServerList) {
      // Remove the server's alive state
      dbCommands = dbCommands.concat([
        [
          'del',
          util.format('server:%s:alive', goneServerList[i])
        ],
        // Remove the server from the server list
        [
          'srem',
          'server:list',
          goneServerList[i]
        ],
        // Purge the server's userlist
        [
          'del',
          util.format('server:%s:users', goneServerList[i])
        ],
        [
          'srem',
          'session:ref',
          purgeList
        ],
        [
          'del',
          util.format('server:%s:messages', goneServerList[i])
        ]
      ]);
    }

    i = 0;
    for (i in purgeList) {
      dbCommands.push([
        'del',
        util.format('session:obj:%s', purgeList[i])
      ]);
    }

    db.multi(dbCommands).exec(function(innerErr) {
      if (innerErr) {
        console.error('Error: Failed while calling Redis: %s', err);
        if (callback !== undefined) {
          callback();
        }
        return;
      }

      if (callback !== undefined) {
        callback();
      }
    });
  });
};

/**
  * This is called periodically to update our activity state to the database.
  * This method in turns calls checkIfMaster(), which calls removeGoneServers() if needed.
  * @method clusterMaintain
  */
server.clusterMaintain = function () {
  db.multi()
    .sadd('server:list', config.server.id)
    .set(util.format('server:%s:alive', config.server.id), '1')
    .expire(util.format('server:%s:alive', config.server.id), (config.server.heartbeat + config.server.killtime))
    .exec(function(err) {
      if (err != null) {
        if (config.debug === true) {
          throw new Error(util.format('An error occured writing to Redis: %s', err));
        }
        console.error('Error: Failed to write to Redis: %s', err);
      }

      server.checkIfMaster();
      maintainContext = setTimeout(server.clusterMaintain, (config.server.heartbeat * 1000));
    });
};

/**
  * Find out which server is the managing one. If we are, call removeGoneServers.
  * @method checkIfMaster
  */
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

          if (data[i] < config.server.id && innerData != null && innerData.toString() === '1') {
            /*if (config.debug) {
              console.log('Another server (%s) found to be in charge', data[i]);
            }*/
            foundBoss = true;
            goneServerList = null;
            return;
          } else if (data[i].toString() === config.server.id.toString()) {
            /*if (config.debug) {
              console.log('This server found to be in charge');
            }*/
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

/**
  * Function which runs the shutdown procedures for server.js.
  * This function is to be called when the server is shutting down.
  * @method shutdown
  * @param {Function} callback A callback to run when the function is done.
  */
server.shutdown = function(callback) {
  if (config.debug) {
    console.log('Debug: Running server.js shutdown procedures');
  }

  if (maintainContext != null) {
    clearTimeout(maintainContext);
  }

  server.removeGoneServers([config.server.id], callback);
};

// Remove data belonging to this server in case something is lingering.
if (config.debug) {
  console.log('Debug: Running server.js startup procedures');
}
server.removeGoneServers([config.server.id]);

// Start the server cluster managing cycle
server.clusterMaintain();

module.exports = server;
