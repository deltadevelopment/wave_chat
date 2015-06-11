var session = require('../  session.js');

var cmd = { };

cmd.command = 'authClient';
cmd.preAuth = true;

cmd.handle = function(client, params) {
  if (session.isAuth(client))
  {
    console.warn('The client on %s tried to double auth. Disconnecting it.', client.remoteAddress);
    client.end();
    return;
  }

  // Create an array to store new messages from the client in as we wait
  // for the auth result
  client.waitAuthCmd = new Array();
  session.doAuth(client, function(success) {
    if (success != true) {
      console.log('Invalid token provided by %s. Disconnecting.', client.remoteAddress);
      client.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }
    // We have the auth result. Good.
    for (dataMessage in client.waitAuthCmd)
      command.handle(client, dataMessage);
    delete command.waitAuthCmd;
  });
}

module.exports = cmd;