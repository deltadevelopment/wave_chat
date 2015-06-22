'use strict';

var uuid = require('uuid');
var _ = require('underscore');
var duck = require('./duck.js');
var config = require('../config.js');

var userManager = {};

userManager.remoteDuckProto = {
  uuid: null,
  uid: null,
  server: null,
  channels: null
};

userManager.localDuckProto = {
  client: null
};
userManager.localDuckProto.prototype = userManager.remoteDuck;

var localUsers = [];

// Local users
userManager.addLocalUser = function(clientObj, userId) {
  var userSession = {
    uuid: uuid.v4(),
    uid: userId,
    server: config.serverId,
    channels: [],
    client: clientObj
  };

  if (config.debug === true) {
    duck.ensureDuck(userSession, userManager.localDuckProto, true);

    if (_.find(localUsers, function(cmpObj) {
      return (cmpObj.uid === userId);
    })) {
      throw new Error('Tried to create two sessions for the same user.');
    }

    console.log('Debug: Adding user %s to the localUser list', userId);
  }

  localUsers.push(userSession);
};

userManager.remLocalUser = function(userId) {
  var sessionObj = userManager.findLocalUser(userId);
  if (config.debug === true) {
    if (sessionObj === undefined) {
      throw new Error('Tried to remove user not added to the localUser list');
    }
    console.log('Debug: Removing user %s from localUser list', userId);
  }

  localUsers = _.without(localUsers, sessionObj);
};

userManager.findLocalUser = function(userId) {
  var sessionObj = _.find(localUsers, function(cmpObj) {
    return (cmpObj.uid === userId);
  });

  if (config.debug === true) {
    if (sessionObj === undefined) {
      console.log('Debug: Failed to find user %s in the localUser list', userId);
    } else {
      console.log('Debug: Found user %s in the localUser list', userId);
    }
  }

  return sessionObj;
};

// Remote users
userManager.findRemoteUser = function() {

};

var a = 'mep';
var b = 'aa';

userManager.addLocalUser(a, b);
userManager.remLocalUser(b);
//userManager.addLocalUser(a, b);
