var config = require('./config');
var Promise = require('bluebird');
var bhttp = require('bhttp');

var api = {}

api.getUserByAuthToken = function(authToken){
  var url= config.apiHost + "/user/by_auth_token/" + authToken;

  return Promise.try(function(){
    return bhttp.get(url);
  }).then(function(res){
    return res.body.data.user;
  });

}

module.exports = api;
