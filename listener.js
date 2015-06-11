var net = require('net');
var config = require('./config.js');
var command = require('./command.js');
var session = require('./session.js');

var listener = net.createServer(function(client){
  // Connected
  {

  }

  // Data
  client.on('data', function(data){
    command.handle(client, data);
  });

  // Disconnected
  client.on('end', function(){
    session.removeSession(client);
  });

  // Error
  client.on('error', function(){
    session.removeSession(client);
  });
});

listener.listen(config.port, config.host, config.backlog);
