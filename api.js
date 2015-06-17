var config = require('./config');
var promise = require('bluebird');
var bhttp = require('bhttp');

var api = {}

/**
  * Fetches a user from the API-server based on
  * the supplied auth_token
  * @param string authToken to look up
  * @param function callback: function(user_object)
  */
api.getUserByAuthToken = function(authToken, callback){
  var url = config.apiHost + "/user/by_auth_token/" + authToken;

  bhttp.get(url, {}, function(err, res){
    if(err) { console.log(err); return }

    if(res.body.success === true){
      callback(res.body.data.user);
    } else {
      callback({});
    }
  });
}

/**
  * Fetches a user from the API-server based on
  * the supplied auth_token
  * @param int originator user_id of the originator of the Ripple
  * @param int receiver user_id of the Ripple
  * @param obj trigger bucket_id where it was triggered
  * @param string message the receiver will receive
  * @param bool pushable should this be pushed or not?
  * @param func callback: function(ripple_object)
  */
// triggee_id, triggee_type/id, user_id, message, pushable
api.createRipple = function(originator, receiver, trigger, message, pushable){
  var url = config.apiHost + "/ripple"
   
  bhttp.post(url, {
    ripple: {
      triggee_id: originator,
      user_id: receiver,
      trigger_id: trigger,
      message: message,
      pushable: pushable,
      action: 'chat' 
    }
  }, function(err, res){
    if(err) { console.log(err); return }

    if(res.body.success === true){
      callback(res.body.data.ripple);
    } else {
      callback({});
    }
  });
}

module.exports = api;
