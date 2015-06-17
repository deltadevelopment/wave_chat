var chan = require('../channel.js');
var sess = require('../session.js');

var cmd = { };
cmd.command = 'join';

cmd.handle = function(client, params) {
  // Add the user to the channel

  var currentChannel = new chan(params.channel);
  currentChannel.addUser(client.userId, function(undefined, userAdded) {
    // Was the user already in the list?
    if (userAdded == false)
      return;

    // Add the channel to the client session
    // This is to make it less work intensive to part the user
    // when he quits. This way we don't have to iterate all channels
    if (client.channels || null == null)
      client.channels = new Array();
    client.channels.push(currentChannel.id);

    console.log('Added user to channel: %s', currentChannel.id);
  });
}

module.exports = cmd;
