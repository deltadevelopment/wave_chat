require('net');
//var requireDir = require('require-dir');

var session = require('./session.js');
//require('./commands');

var command = { };

var testData = {
    command: 'test',
    params: {
      param1: 'one',
      param2: 'two'
    }
  };

command.handle = function(client, data) {
  data = testData;

  // If we're waiting for the result of auth,
  // save the command for later
  if (client.waitAuthCmd != undefined) {
    client.waitAuthCmd.push(data);
    return;
  }

  try {
    if (data.command === 'authClient')
    {
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
          client.end({ error: 'Invalid token' });
          return;
        }
        // We have the auth result. Good.
        for (dataMessage in client.waitAuthCmd)
          command.handle(client, dataMessage);
        delete command.waitAuthCmd;
      });
      return;
    }


  } catch (ex) {
    console.error('Could not handle packet from %. Closing connection.', client.remoteAddress);
    client.end({ error: 'Could not handle packet' });
    return;
  }

}


module.exports = command;
