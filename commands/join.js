var chan = require('../channel.js');
var sess = require('../session.js');

var cmd = { };
cmd.command = 'join';

cmd.handle = function(client, params) {
  var currentChannel = new chan(params.channel);
  currentChannel.addUser(client.userId);
}

module.exports = cmd;
