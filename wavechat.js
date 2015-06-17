var net = require('net');

//var net = require('tls');
var fs = require('fs');

var config = require('./config.js');
var command = require('./command.js');
var session = require('./session.js');


var options = {
  key: fs.readFileSync('./ssl/key.key'),
  cert: fs.readFileSync('./ssl/cert.crt')
}

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
    session.remSession(client);
  });

  // Error
  client.on('error', function(){
    session.remSession(client);
  });
});

listener.listen(config.port, config.host, config.backlog);
