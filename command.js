require('net');
var requireDir = require('require-dir');

var session = require('./session.js');
var cmdList = requireDir('./commands');

var command = { };

var testData = {
    command: 'authClient',
    params: {
      param1: 'one',
      param2: 'two'
    }
  };

command.handle = function(client, data) {
//  data = testData;

  // If we're waiting for the result of auth,
  // save the command for later
  if (client.waitAuthCmd != undefined) {
    client.waitAuthCmd.push(data);
    return;
  }

  if (data.command === undefined) {
    console.warn('%s tried to run an empty command', client.remoteAddress);
    client.end();
    return;
  }

  if (data.params === undefined)
    data.params = { };

  // Find the command to execute
  var foundCommand = false;
  for (c in cmdList) {
    if (cmdList[c].command != data.command)
      continue;

    if (cmdList[c].preAuth != true && session.isAuth(client) == false) {
      console.warn('%s tried to execute a command without authenticating.', client.remoteAddress);
      client.end(JSON.stringify({error: 'You must auth before running this command' }));
      return;
    }

    foundCommand = true;
    cmdList[c].handle(client, data.params);
  }

  if (foundCommand == false) {
    console.warn('%s tried to run a non-existant command', client.remoteAddress);
    client.end(JSON.stringify({ error: 'No such command' }));
    return;
  }

}


module.exports = command;
