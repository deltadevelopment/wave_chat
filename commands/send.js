var chan = require('../channel.js');
var sess = require('../session.js');

var cmd = { };
cmd.command = 'send';

cmd.handle = function(client, params) {
  // Make sure the user is in the channel
  var missingField = undefined;
  if ((params.message == false && (missingField = 'message') == true) ||
      (params.channel == false && (missingField = 'channel') == true)) {
    console.warn('Protocol violation by %s. %s field empty. - Disconnecting.', client.remoteAddress, missingField);
    client.end();
    return;
  }

  var currentChannel = new chan(params.channel);
  currentChannel.hasUser(client.userId, function(undefined, userId, hasUser) {
    if (hasUser == false) {
      console.warn('Protocol violation by %s. Can\'t send message to channel the client isn\'t in. - Disconnecting.', client.remoteAddress);
      client.end();
      return;
    }


    currentChannel.sendMessage(userId, params.message);
  });
}

module.exports = cmd;
