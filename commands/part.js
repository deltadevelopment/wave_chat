var chan = require('../channel.js');
var sess = require('../session.js');
var _ = require('underscore');

var cmd = { };
cmd.command = 'part';

cmd.handle = function(client, params) {
  var currentChannel = new chan(params.channel);
  currentChannel.remUser(client.userId, function(undefined, userRemoved) {
    // If the user wasn't in the list, don't do anything
    if (userRemoved == false)
      return;

    client.channels = _.without(client.channels, currentChannel.id);
    console.log('Parted user from channel: %s', currentChannel.id);
  });
}

module.exports = cmd;
