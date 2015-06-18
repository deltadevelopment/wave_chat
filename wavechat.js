var net = require('net');

//var net = require('tls');
var fs = require('fs');

var chan = require('./channel.js');
var config = require('./config.js');
var command = require('./command.js');
var session = require('./session.js');


var options = {
  key: fs.readFileSync('./ssl/key.key'),
  cert: fs.readFileSync('./ssl/cert.crt')
}

function quitUser(client) {
  // Part the user from all channels
  if (client.channels || null == null) {
    for (i in client.channels) {
      var currentChannel = new chan(client.channels[i]);
      console.log('Quit-parting user %s from channel %s', client.userId, currentChannel.id);
      currentChannel.remUser(client.userId);
    }
  }

  // Remove the user's session
  session.remSession(client);
}

process.on('SIGINT', function() {
  // We don't want to modify the array we're iterating
  var sessionListCopy = session.list.slice();
  for (i in sessionListCopy) {
    quitUser(session.list[i].client);
  }
  process.exit();
});

var listener = net.createServer(options, function(client){
  // Connected
  {
  }

  // Data
  client.on('data', function(data){
    command.handle(client, data);
  });

  // Disconnected
  client.on('end', function(){
    quitUser(client);
  });

  // Error
  client.on('error', function(data){
    console.log(data);
    //quitUser(client);
  });
});

listener.listen(config.port, config.host, config.backlog);
