//var api = require('./api.js');

var session = { };
var sessionList = new Array();

session.isAuth = function(client) {
  for (sess in sessionList) {
    if (sess === client)
      return true;
    }
    return false;
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
