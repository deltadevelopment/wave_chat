require('net');
var requireDir = require('require-dir');

var session = require('./session.js');
var helpers = require('./helpers.js');
var cmdList = requireDir('./commands');

var command = { };

var fakeCommandCounter = 0;
command.handle = function(client, data) {
  data = JSON.parse(data.toString());

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

    if (cmdList[c].preAuth != true && session.hasLocalSession(client) == null) {
      console.warn('%s tried to execute a command without authenticating.', client.remoteAddress);
      client.end(helpers.createError(407, 'You must authenticated before running this command', true));
      return;
    }

    foundCommand = true;
    cmdList[c].handle(client, data.params);
  }

  if (foundCommand == false) {
    console.warn('%s tried to run a non-existant command', client.remoteAddress);
    client.end(helpers.createError(420, 'No such command', true));
    return;
  }
}

module.exports = command;
