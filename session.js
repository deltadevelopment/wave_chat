//var api = require('./api.js');

var session = { };
var sessionList = { };

session.isAuth = function(client) {
  if (sessionList.client === undefined)
    return false;
  return true;
}

session.doAuth = function(client, callback) {

}

session.removeSession = function(client) {
  var sessionIndex = sessionList.indexOf(client);
  if (sessionIndex < 0)
    return;

  sessionList.splice(sessionIndex, 1);
}

module.exports = session;
