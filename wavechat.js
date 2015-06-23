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


process.on('SIGINT', function() {
  // We don't want to modify the list we're iterating
  /*var sessCopy = session.list.splice();
  for (i in sessCopy)
    quitUser(session.list[i].client);*/
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
    if (client.isQuit == true)
      return;
    session.quitUser(client);
  });

  // Error
  client.on('error', function(data){
    console.log(data);
    //quitUser(client);
  });
});

listener.listen(config.port, config.host, config.backlog);
