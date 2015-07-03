'use strict';

var config = require('../config.js');
var bhttp = require('bhttp');

var api = {};

// TODO: Implement this
api.verifyToken = function(userId, userToken, callback) {
  callback(true);
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
      callback(res.body.data.user.username);
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

    callback(res.body.username);
  });
};

{ interaction: { user_id: 1, topic_id: 2 (bucket_id), topic_type: “Bucket”, action: “create_chat_message” } }

api.sendRippleMessage = function(uid, bucketid) {
  var dataObj = {
    user_id: uid,
    topic_id: bucketid,
    topic_type: 'Bucket',
    action: 'create_chat_message'
  };

  bhttp.post(config.api.endpoint + '/interaction', {}, { encoreJSON: true, headers: { 'X-AUTH-TOKEN': config.secret.apikey }}, function(err, res) {
    console.log(res.body.toString());
  });
}

api.sendInteraction();

module.exports = api;
