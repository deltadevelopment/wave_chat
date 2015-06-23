var chan = require('../channel.js');
var sess = require('../session.js');
var helpers = require('../helpers.js');

var cmd = { };
cmd.command = 'send';

cmd.handle = function(client, params) {
  // Make sure the user is in the channel
  var missingField = undefined;
  if ((params.message == false && (missingField = 'message') == true) ||
      (params.channel == false && (missingField = 'channel') == true)) {
    console.warn('Protocol violation by %s. %s field empty. - Disconnecting.', client.remoteAddress, missingField);
    helpers.createError(100, 'Missing a parameter.', true);
    client.end();
    return;
  }

  var currentChannel = new chan(params.bucket);
  currentChannel.hasUser(client.userId, function(undefined, userId, hasUser) {
    if (hasUser == false) {
      console.warn('Protocol violation by %s. Can\'t send message to channel the client isn\'t in. - Disconnecting.', client.remoteAddress);
      helpers.createError(405, 'Can\'t send message to a channel the client hasn\'t joined.', true);
      client.end();
      return;
    }

    currentChannel.sendMessage(userId, params.message);
  });
}

module.exports = cmd;
