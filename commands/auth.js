var session = require('../session.js');
var command = require('../command.js');

var cmd = { };

cmd.command = 'auth';
cmd.preAuth = true;

cmd.handle = function(client, params) {

  if (session.hasLocalSession(client)) {
    console.warn('%s tried to double auth. Disconnecting it.', client.remoteAddress);
    client.end();
  }

  if (session.isAuth(client, params.authtoken, function(userId, authOk) {
    if (authOk == false) {
      console.log(u.format('%s provided wrong auth. details. Closing.', client.remoteAddress));
      client.write(JSON.stringify({ error: 'Auth not OK' }));
      client.end();
      return;
    }

    session.addSession(userId, client);

    for (dataMessage in client.waitAuthCmd)
      command.handle(client, dataMessage);
    delete command.waitAuthCmd;
  }));
}

module.exports = cmd;
