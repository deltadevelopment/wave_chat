var u = require('util');
var session = require('../session.js');
var command = require('../command.js');
var helpers = require('../helpers.js');

var cmd = { };

cmd.command = 'auth';
cmd.preAuth = true;

cmd.handle = function(client, params) {
  if (session.hasLocalSession(client)) {
    console.warn('%s tried to double auth. Disconnecting it.', client.remoteAddress);
    client.write(helpers.createError(420, 'Authorization token not valid', true));
    client.end();
  }

  if (session.isAuth(params.authToken, function(userId) {
    if (userId == null) {
      console.log(u.format('%s provided wrong auth. details. Closing.', client.remoteAddress));
      client.write(helpers.createError(401, 'Authorization token not valid', true));
      client.end();
      return;
    }

    session.addSession(userId, client, function() {
      for (dataMessage in client.waitAuthCmd)
        command.handle(client, dataMessage);
      delete command.waitAuthCmd;
    });
  }));
}

module.exports = cmd;
