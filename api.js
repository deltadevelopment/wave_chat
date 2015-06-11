var config = require('./config');
var promise = require('bluebird');
var bhttp = require('bhttp');

var api = {}

api.getUserByAuthToken = function(authToken, callback){
  var url = config.apiHost + "/user/by_auth_token/" + authToken;

  bhttp.get(url, {}, function(err, res){
    if(err) { console.log(err); return }

    if(res.body.data.success === true){
      callback(res.body.data.user);
    } else {
      callback({});
    }
  });
}

module.exports = api;
