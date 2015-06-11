var api = require('./api.js');

var session = { };
var sessionList = new Array();

session.isAuth = function(client) {
  for (sess in sessionList) {
    if (sess === client)
      return true;
    }
    return false;
}

session.doAuth = function(client, authToken, callback) {
  api.getUserByAuthToken(authToken, function(res){
//    if res.hasOwnProperty("username");
//      sessionList.push(client);
  });
}

session.removeSession = function(client) {
  var sessionIndex = sessionList.indexOf(client);
  if (sessionIndex < 0)
    return;

  sessionList.splice(sessionIndex, 1);
}

module.exports = session;
