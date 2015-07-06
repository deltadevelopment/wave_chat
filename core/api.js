'use strict';

var bhttp = require('bhttp');
var config = require('../config.js');

var api = {};

api.verifyToken = function(userId, userToken, callback) {
  // TODO: Implement caching

  api.getUserByAuthToken(userToken, function(uid) {
    if (uid === null || userId !== uid) {
      callback(false);
      return;
    }
    callback(true);
  });
};

/**
  * Fetches a user from the API-server based on
  * the supplied auth_token
  * @param string authToken to look up
  * @param function callback: function(user_object)
  */
api.getUserByAuthToken = function(authToken, callback) {
  var url = config.api.endpoint + '/user/by_auth_token/' + authToken;
  bhttp.get(url, {}, function(err, res){
    if(err) {
      console.log(err);
      return;
    }

    if(res.body.success === true) {
      callback(res.body.data.user.id, res.body.data.user.username);
    } else {
      callback(null);
    }
  });
};

api.login = function(username, password, callback) {
  bhttp.post(config.api.endpoint + '/login', { user: { username: username, password: password } }, {encodeJSON: true}, function(err, res) {
    if (err) {
      console.error('Error: Could not login user. ', err);
      callback(null);
      return;
    }

    if (res.body.success !== true) {
      callback(null);
      return;
    }

    callback(res.body.data.user_session.auth_token, res.body.data.user_session.user_id);
  });
};

api.sendInteractionMessage = function(uid, bucketid, exclude, callback) {
  /* eslint-disable camelcase */
  var dataObj = {
    interaction: {
      user_id: uid,
      topic_id: bucketid,
      topic_type: 'Bucket',
      action: 'create_chat_message',
      users_watching: exclude
    }
  };
  /* eslint-enable camelcase */

  bhttp.post(config.api.endpoint + '/interaction', dataObj, { encodeJSON: true, headers: { 'X-AUTH-TOKEN': config.secret.apikey }}, function(err, res) {
    if (err) {
      console.error('Error: Error while talking to API:', err);
      return;
    }

    if (callback !== undefined) {
      callback(
        res.body.success !== false
        ? res.body
        : null
      );
    }
  });
};

module.exports = api;
