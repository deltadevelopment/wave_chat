'use strict';

var duck = require('./duck.js');
var config = require('../config.js');
var usermanager = require('./usermanager.js');

/**
  * This class is responsible for sending messages to users.
  * It contains functions to send messages to local users,
  * remote users and offline users.
  * Datastore:
  * Channel messages:
  * LIST message:%s, bucketId
  * @class message
  */
var message = {};

message.duckProto = {
  uuid: null,
  sender: null,
  bucket: null,
  ts: null
};

/**
  * Send a message to a local user.
  * @param {Object} targetObj The user object,
  * or an array of user objects of the receiver(s).
  * @param {Object} messageObj The message object to send.
  */
message.sendLocal = function(targetObj, messageObj) {
  if (config.debug) {
    duck.ensureDuck(targetObj, usermanager.localDuckProto);
  }


  messageObj.client.write(JSON.parse(messageObj));
};

/**
  * Send a message to a remote user.
  * @param {Object} targetObj The user object,
  * or an array of user objects of the receiver(s).
  * @param {Object} messageObj The message object to send.
  */
message.sendRemote = function(senderObj, messageObj) {
  if (config.debug) {
    duck.ensureDuck(targetObj, usermanager.remoteDuckProto);
  }


};

/**
  * Send a ripple to a user.
  * @param {Object} targetObj The user object,
  * or an array of user objects of the receiver(s).
  * @param {Object} messageObj The message object to send.
  */

message.sendRipple = function(senderObj, messageObj) {

};

message.send = function(senderArr, messageObj) {

};


message.shutdown = function(callback) {

  if (callback !== undefined) {
    callback();
  }
};

module.exports = message;
