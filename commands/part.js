var chan = require('../channel.js');
var sess = require('../session.js');

var cmd = { };
cmd.command = 'part';

cmd.handle = function(client, params) {
  var currentChannel = new chan(params.channel);
  currentChannel.remUser(client.userId);
}

module.exports = cmd;
