var config = require('./config');
var promise = require('bluebird');
var bhttp = require('bhttp');

var api = {}

api.getUserByAuthToken = function(authToken, callback){
  var url= config.apiHost + "/user/by_auth_token/" + authToken;

  promise.try(function(){
    return bhttp.get(url);
  }).then(function(res){
    callback(res.body.data.user);
  });

}

module.exports = api;
